-- ML Training Data tables for DROP
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Requires: workouts table already exists

-- Workout sequences: stores full keypoint streams for ML training
create table public.workout_sequences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  workout_id uuid references public.workouts on delete cascade,
  exercise_type text not null,
  fps integer not null default 30,
  duration_ms integer not null,
  frame_count integer not null,
  reported_count integer not null,
  -- Compact format: array of frames, each frame is flat array of [x0,y0,s0,x1,y1,s1,...] for 17 keypoints = 51 values per frame
  keypoints jsonb not null,
  device_info jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Sequence labels: human-annotated rep timestamps for training data
create table public.sequence_labels (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references public.workout_sequences on delete cascade not null,
  rep_frames integer[] not null, -- frame indices marking the bottom of each rep
  labeled_by text not null, -- admin identifier
  notes text default '',
  labeled_at timestamptz default now() not null
);

-- Indexes
create index workout_sequences_user_id_idx on public.workout_sequences (user_id);
create index workout_sequences_exercise_type_idx on public.workout_sequences (exercise_type);
create index workout_sequences_created_at_idx on public.workout_sequences (created_at desc);
create index sequence_labels_sequence_id_idx on public.sequence_labels (sequence_id);

-- RLS
alter table public.workout_sequences enable row level security;
alter table public.sequence_labels enable row level security;

-- Users can insert their own sequences
create policy "Users can insert own sequences"
  on public.workout_sequences for insert with check (auth.uid() = user_id);

-- Anyone authenticated can read sequences (admin uses service role for full access)
create policy "Authenticated users can read sequences"
  on public.workout_sequences for select using (auth.role() = 'authenticated');

-- Labels: readable by authenticated, insertable by authenticated (admin does the labeling)
create policy "Authenticated users can read labels"
  on public.sequence_labels for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert labels"
  on public.sequence_labels for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update labels"
  on public.sequence_labels for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete labels"
  on public.sequence_labels for delete using (auth.role() = 'authenticated');
