-- Email Preferences Migration
-- Run this in Supabase SQL Editor after the base schema is set up.

-- 1. Create email_preferences table
create table if not exists public.email_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  digest_enabled boolean not null default true,
  digest_frequency text not null default 'weekly'
    check (digest_frequency in ('daily', 'weekly')),
  streak_reminders boolean not null default true,
  milestone_emails boolean not null default true,
  last_digest_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.email_preferences enable row level security;

create policy "Users can view own email preferences"
  on public.email_preferences for select using (auth.uid() = id);

create policy "Users can update own email preferences"
  on public.email_preferences for update using (auth.uid() = id);

create policy "Users can insert own email preferences"
  on public.email_preferences for insert with check (auth.uid() = id);

-- 3. Add updated_at trigger
create trigger email_preferences_updated_at
  before update on public.email_preferences
  for each row execute function public.update_updated_at();

-- 4. Update handle_new_user() to also create email_preferences row
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.gamification_state (id)
  values (new.id);

  insert into public.email_preferences (id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- 5. Backfill existing users who don't have email_preferences rows yet
insert into public.email_preferences (id)
select id from auth.users
where id not in (select id from public.email_preferences)
on conflict (id) do nothing;
