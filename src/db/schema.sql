-- SAT Prep App — Supabase Schema
-- Run this in Supabase SQL Editor to set up all tables, RLS, and triggers.

-- 1. profiles — extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  role text not null default 'student',
  school text,
  grade_level int,
  target_test_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
-- SECURITY NOTE: This policy restricts updates to only safe columns.
-- Without column restrictions, a user could SET role = 'admin' to escalate privileges.
-- The WITH CHECK ensures the role column cannot be changed by the user.
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id AND role = (select role from public.profiles where id = auth.uid()));
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. user_progress — per-user per-question progress (SM2, mastery)
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  mastery_level int not null default 0,
  ease_factor real not null default 2.5,
  interval int not null default 0,
  repetition int not null default 0,
  next_review_date timestamptz,
  last_attempted timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.user_progress for update using (auth.uid() = user_id);
create policy "Users can delete own progress"
  on public.user_progress for delete using (auth.uid() = user_id);

-- 3. attempts — detailed attempt history
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  correct boolean not null,
  user_answer text not null,
  confidence_rating int,
  hints_used int not null default 0,
  deep_dive_completed boolean not null default false,
  deep_dive_correct boolean,
  error_category text,
  second_chance_question_id text,
  second_chance_correct boolean,
  sm2_rating int,
  session_id text,
  mode text,
  created_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

create policy "Users can view own attempts"
  on public.attempts for select using (auth.uid() = user_id);
create policy "Users can insert own attempts"
  on public.attempts for insert with check (auth.uid() = user_id);

-- 4. gamification_state — single row per user (XP, streaks, badges, quests, settings)
create table public.gamification_state (
  id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  xp_history jsonb not null default '[]'::jsonb,
  earned_badges jsonb not null default '[]'::jsonb,
  sessions_completed int not null default 0,
  study_streak int not null default 0,
  longest_streak int not null default 0,
  last_study_date date,
  streak_freezes int not null default 0,
  quest_progress jsonb not null default '{}'::jsonb,
  bosses_defeated jsonb not null default '[]'::jsonb,
  section_quests jsonb not null default '{"readingWritingComplete":false,"mathComplete":false,"satReady":false}'::jsonb,
  calibration_data jsonb not null default '{"recentAttempts":[]}'::jsonb,
  deep_dives_completed int not null default 0,
  session_history jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{"thinkPeriodEnabled":true,"scaffoldingOverrides":{},"hasSeenWelcome":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gamification_state enable row level security;

create policy "Users can view own gamification"
  on public.gamification_state for select using (auth.uid() = id);
create policy "Users can update own gamification"
  on public.gamification_state for update using (auth.uid() = id);
create policy "Users can insert own gamification"
  on public.gamification_state for insert with check (auth.uid() = id);

-- 5. exam_wrappers — error breakdown reflections
create table public.exam_wrappers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_timestamp bigint not null,
  date bigint not null,
  error_breakdown jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.exam_wrappers enable row level security;

create policy "Users can view own exam wrappers"
  on public.exam_wrappers for select using (auth.uid() = user_id);
create policy "Users can insert own exam wrappers"
  on public.exam_wrappers for insert with check (auth.uid() = user_id);

-- 6. mock_tests — mock test scores and module breakdown
create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp bigint not null,
  score jsonb not null,
  modules jsonb not null,
  duration int not null,
  created_at timestamptz not null default now()
);

alter table public.mock_tests enable row level security;

create policy "Users can view own mock tests"
  on public.mock_tests for select using (auth.uid() = user_id);
create policy "Users can insert own mock tests"
  on public.mock_tests for insert with check (auth.uid() = user_id);

-- Trigger: auto-create profiles + gamification_state on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.gamification_state (id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.update_updated_at();

create trigger gamification_state_updated_at
  before update on public.gamification_state
  for each row execute function public.update_updated_at();

-- RPC: delete user account and all data
create or replace function public.delete_user_account()
returns void as $$
begin
  -- Delete from all tables (cascades from auth.users)
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
