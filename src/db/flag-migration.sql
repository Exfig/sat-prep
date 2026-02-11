-- Flag Question Feature: migration
-- Run this in Supabase SQL Editor

-- 1. Create question_flags table
create table question_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  description text not null default '' check (length(description) <= 1000),
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table question_flags enable row level security;

-- Users can insert their own flags
create policy "Users can insert own flags"
  on question_flags for insert
  with check (auth.uid() = user_id);

-- Users can view their own flags
create policy "Users can view own flags"
  on question_flags for select
  using (auth.uid() = user_id);

-- Admins can view all flags
create policy "Admins can view all flags"
  on question_flags for select
  using (is_admin());

-- Admins can update flags (resolve/reopen)
create policy "Admins can update flags"
  on question_flags for update
  using (is_admin());

-- 3. RPC: admin_list_flags — returns all flags with user email/name
-- SECURITY FIX: Changed from language sql to plpgsql with is_admin() guard.
-- The original version had no admin check, allowing any authenticated user
-- to call this function and read all flags + user emails.
create or replace function admin_list_flags()
returns table (
  id uuid,
  user_id uuid,
  question_id text,
  description text,
  resolved boolean,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz,
  user_email text,
  user_name text
)
language plpgsql
security definer
as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    qf.id,
    qf.user_id,
    qf.question_id,
    qf.description,
    qf.resolved,
    qf.resolved_at,
    qf.resolved_by,
    qf.created_at,
    u.email::text as user_email,
    coalesce(p.full_name, '')::text as user_name
  from question_flags qf
  join auth.users u on u.id = qf.user_id
  left join profiles p on p.id = qf.user_id
  order by qf.created_at desc;
end;
$$;

-- 4. RPC: admin_resolve_flag — toggles resolved status
create or replace function admin_resolve_flag(target_flag_id uuid, resolve boolean)
returns void
language plpgsql
security definer
as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  update question_flags
  set
    resolved = resolve,
    resolved_at = case when resolve then now() else null end,
    resolved_by = case when resolve then auth.uid() else null end
  where id = target_flag_id;
end;
$$;
