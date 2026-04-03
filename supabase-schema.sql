-- DROP app database schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_color text not null default '#6366f1',
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Workouts table
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  exercise_type text not null default 'pushup',
  count integer not null,
  duration integer not null, -- seconds
  average_form_score integer not null default 0,
  timestamps jsonb default '[]'::jsonb,
  date timestamptz default now() not null,
  verified boolean default true
);

-- Friendships table (bidirectional)
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  friend_id uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, friend_id)
);

-- Indexes for performance
create index workouts_user_id_idx on public.workouts (user_id);
create index workouts_date_idx on public.workouts (date desc);
create index workouts_exercise_type_idx on public.workouts (exercise_type);
create index friendships_user_id_idx on public.friendships (user_id);
create index friendships_friend_id_idx on public.friendships (friend_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.friendships enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Workouts: anyone can read (for leaderboard), users can insert their own

create policy "Users can insert own workouts"
  on public.workouts for insert with check (auth.uid() = user_id);

create policy "Users can read all workouts"
  on public.workouts for select using (true);

-- Friendships: users can manage their own
create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can add friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id);

-- Function to handle new user signup → auto-create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#6366f1')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Analytics events table (tracks all user interactions)
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete set null,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  page text,
  session_id text,
  created_at timestamptz default now() not null
);

-- Indexes for analytics queries
create index analytics_events_user_id_idx on public.analytics_events (user_id);
create index analytics_events_event_name_idx on public.analytics_events (event_name);
create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_session_id_idx on public.analytics_events (session_id);

-- RLS for analytics
alter table public.analytics_events enable row level security;

-- Anyone can insert events (including anonymous users)
create policy "Anyone can insert analytics events"
  on public.analytics_events for insert with check (true);

-- Only the user can read their own events (admin reads via service role)
create policy "Users can read own analytics"
  on public.analytics_events for select using (auth.uid() = user_id);

-- Leaderboard view for fast queries (supports exercise_type filtering via app layer)
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_color,
  p.avatar_url,
  w.exercise_type,
  coalesce(sum(w.count), 0)::integer as total_reps,
  coalesce(max(w.count), 0)::integer as best_session,
  coalesce(avg(w.average_form_score), 0)::integer as average_form,
  count(w.id)::integer as workout_count
from public.profiles p
left join public.workouts w on w.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_color, w.exercise_type
order by total_reps desc;
