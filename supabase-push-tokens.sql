-- Push notification tokens for DROP
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  token text not null,
  platform text not null default 'ios', -- 'ios' or 'android'
  active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, platform)
);

-- Indexes
create index push_tokens_user_id_idx on public.push_tokens (user_id);
create index push_tokens_active_idx on public.push_tokens (active) where active = true;

-- RLS
alter table public.push_tokens enable row level security;

-- Users can insert/update their own tokens
create policy "Users can insert own push tokens"
  on public.push_tokens for insert with check (auth.uid() = user_id);

create policy "Users can update own push tokens"
  on public.push_tokens for update using (auth.uid() = user_id);

-- Service role reads all tokens for sending (no select policy for regular users needed)
-- Admin/edge function uses service role key to query active tokens
create policy "Users can read own push tokens"
  on public.push_tokens for select using (auth.uid() = user_id);
