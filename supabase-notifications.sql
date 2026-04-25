-- Notification preferences and delivery log for DROP
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Add motivation_tier to profiles so server-side notifications can pick the
-- right copy. Client today stores this in localStorage; we mirror it here.
alter table public.profiles
  add column if not exists motivation_tier text not null default 'motivational'
  check (motivation_tier in ('motivational', 'push_me', 'roast_me'));

-- Per-user notification preferences
create table public.notification_preferences (
  user_id uuid references public.profiles on delete cascade primary key,
  streak_reminders boolean not null default true,
  milestone_alerts boolean not null default true,
  friend_activity boolean not null default true,
  challenge_updates boolean not null default true,
  -- Quiet hours stored as integer hour (0-23) in user's local time.
  -- Server uses this with the offset stored below to decide if it's quiet.
  quiet_hours_start integer not null default 22, -- 10pm
  quiet_hours_end integer not null default 8,    -- 8am
  -- Minutes east of UTC for the user's local clock; null = unknown, treat as UTC
  timezone_offset_minutes integer,
  -- Last reminder sent — used to throttle so users don't get spammed
  last_streak_reminder_at timestamptz,
  last_comeback_reminder_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.notification_preferences enable row level security;

create policy "Users can read own notification preferences"
  on public.notification_preferences for select using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update using (auth.uid() = user_id);

-- Auto-create row when a profile is created
create or replace function public.handle_new_profile_notif_prefs()
returns trigger as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_notif_prefs
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notif_prefs();

-- Backfill rows for existing profiles
insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- Notification delivery log (for debugging + dedup)
create table public.notification_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  category text not null, -- 'streak_reminder', 'milestone', 'friend_activity', 'challenge'
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  apns_response_status integer,
  apns_response_body text,
  delivered boolean not null default false,
  created_at timestamptz default now() not null
);

create index notification_log_user_id_idx on public.notification_log (user_id);
create index notification_log_created_at_idx on public.notification_log (created_at desc);
create index notification_log_category_idx on public.notification_log (category);

alter table public.notification_log enable row level security;

create policy "Users can read own notification log"
  on public.notification_log for select using (auth.uid() = user_id);
