-- kintore-rank Phase 1 schema
-- Supabase の SQL Editor で実行してください。

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 300),
  prefecture text,
  main_category text not null default 'gym' check (main_category in ('gym', 'bodyweight')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  performed_on date not null default current_date,
  exercise_id text not null,
  category text not null check (category in ('gym', 'bodyweight')),
  weight_kg numeric(6, 2) not null default 0 check (weight_kg between 0 and 1000),
  reps integer not null check (reps between 1 and 1000),
  sets integer not null default 1 check (sets between 1 and 100),
  memo text check (char_length(memo) <= 500),
  body_weight_kg numeric(5, 1),
  created_at timestamptz not null default now()
);

create index if not exists workout_logs_user_exercise_idx
  on public.workout_logs (user_id, exercise_id, performed_on desc, created_at desc);
create index if not exists workout_logs_user_date_idx
  on public.workout_logs (user_id, performed_on desc, created_at desc);

-- Row Level Security: Phase 1 は自分のデータのみ
alter table public.profiles enable row level security;
alter table public.workout_logs enable row level security;

drop policy if exists "profiles: own select" on public.profiles;
create policy "profiles: own select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles: own insert" on public.profiles;
create policy "profiles: own insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "logs: own select" on public.workout_logs;
create policy "logs: own select" on public.workout_logs
  for select using (auth.uid() = user_id);
drop policy if exists "logs: own insert" on public.workout_logs;
create policy "logs: own insert" on public.workout_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "logs: own update" on public.workout_logs;
create policy "logs: own update" on public.workout_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "logs: own delete" on public.workout_logs;
create policy "logs: own delete" on public.workout_logs
  for delete using (auth.uid() = user_id);
