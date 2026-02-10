-- Admin Panel Migration
-- Run in Supabase SQL Editor AFTER the base schema.sql has been applied.

-- ============================================================
-- 1. is_admin() helper
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ============================================================
-- 2. Admin RLS policies (SELECT on all tables, UPDATE on profiles, DELETE on all)
-- ============================================================

-- profiles
create policy "Admin can view all profiles"
  on public.profiles for select using (public.is_admin());
create policy "Admin can update all profiles"
  on public.profiles for update using (public.is_admin());
create policy "Admin can delete profiles"
  on public.profiles for delete using (public.is_admin());

-- user_progress
create policy "Admin can view all user_progress"
  on public.user_progress for select using (public.is_admin());
create policy "Admin can delete user_progress"
  on public.user_progress for delete using (public.is_admin());

-- attempts
create policy "Admin can view all attempts"
  on public.attempts for select using (public.is_admin());
create policy "Admin can delete attempts"
  on public.attempts for delete using (public.is_admin());

-- gamification_state
create policy "Admin can view all gamification_state"
  on public.gamification_state for select using (public.is_admin());
create policy "Admin can delete gamification_state"
  on public.gamification_state for delete using (public.is_admin());

-- exam_wrappers
create policy "Admin can view all exam_wrappers"
  on public.exam_wrappers for select using (public.is_admin());
create policy "Admin can delete exam_wrappers"
  on public.exam_wrappers for delete using (public.is_admin());

-- mock_tests
create policy "Admin can view all mock_tests"
  on public.mock_tests for select using (public.is_admin());
create policy "Admin can delete mock_tests"
  on public.mock_tests for delete using (public.is_admin());

-- ============================================================
-- 3. admin_list_users() RPC
-- ============================================================
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  school text,
  grade_level int,
  target_test_date date,
  created_at timestamptz,
  xp int,
  study_streak int,
  sessions_completed int
) as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.full_name,
      p.role,
      p.school,
      p.grade_level,
      p.target_test_date,
      p.created_at,
      coalesce(g.xp, 0),
      coalesce(g.study_streak, 0),
      coalesce(g.sessions_completed, 0)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.gamification_state g on g.id = p.id
    order by p.created_at desc;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 4. admin_delete_user(target_user_id uuid) RPC
-- ============================================================
create or replace function public.admin_delete_user(target_user_id uuid)
returns void as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  -- Deleting from auth.users cascades to all public tables
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 5. admin_question_stats() RPC
-- ============================================================
create or replace function public.admin_question_stats()
returns table (
  question_id text,
  total_attempts bigint,
  correct_count bigint,
  accuracy numeric,
  avg_hints_used numeric
) as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select
      a.question_id,
      count(*)::bigint as total_attempts,
      count(*) filter (where a.correct)::bigint as correct_count,
      round(100.0 * count(*) filter (where a.correct) / nullif(count(*), 0), 1) as accuracy,
      round(avg(a.hints_used)::numeric, 2) as avg_hints_used
    from public.attempts a
    group by a.question_id
    order by count(*) desc;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 6. admin_question_error_breakdown(target_question_id text) RPC
-- ============================================================
create or replace function public.admin_question_error_breakdown(target_question_id text)
returns table (
  error_category text,
  count bigint
) as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select
      coalesce(a.error_category, 'none') as error_category,
      count(*)::bigint
    from public.attempts a
    where a.question_id = target_question_id
      and a.correct = false
    group by a.error_category
    order by count(*) desc;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 7. admin_usage_stats() RPC
-- ============================================================
create or replace function public.admin_usage_stats()
returns json as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'totalUsers', (select count(*) from public.profiles),
    'totalAttempts', (select count(*) from public.attempts),
    'overallAccuracy', (
      select round(100.0 * count(*) filter (where correct) / nullif(count(*), 0), 1)
      from public.attempts
    ),
    'rwAttempts', (
      select count(*) from public.attempts where question_id like 'rw-%'
    ),
    'rwAccuracy', (
      select round(100.0 * count(*) filter (where correct) / nullif(count(*), 0), 1)
      from public.attempts where question_id like 'rw-%'
    ),
    'mathAttempts', (
      select count(*) from public.attempts where question_id like 'math-%'
    ),
    'mathAccuracy', (
      select round(100.0 * count(*) filter (where correct) / nullif(count(*), 0), 1)
      from public.attempts where question_id like 'math-%'
    ),
    'totalMockTests', (select count(*) from public.mock_tests),
    'avgMockScore', (
      select round(avg(
        ((score->>'readingWriting')::int + (score->>'math')::int)
      ))
      from public.mock_tests
    ),
    'activeToday', (
      select count(distinct user_id)
      from public.attempts
      where created_at >= current_date
    ),
    'activeThisWeek', (
      select count(distinct user_id)
      from public.attempts
      where created_at >= date_trunc('week', current_date)
    )
  ) into result;

  return result;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 8. Set achberger@gmail.com as admin
-- ============================================================
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'achberger@gmail.com');
