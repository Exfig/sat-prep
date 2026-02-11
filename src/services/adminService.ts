import { supabase } from '../lib/supabase';

// ─── Types ───

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  school: string | null;
  grade_level: number | null;
  target_test_date: string | null;
  created_at: string;
  xp: number;
  study_streak: number;
  sessions_completed: number;
}

export interface QuestionStatsRow {
  question_id: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
  avg_hints_used: number;
}

export interface ErrorBreakdownRow {
  error_category: string;
  count: number;
}

export interface UsageStats {
  totalUsers: number;
  totalAttempts: number;
  overallAccuracy: number | null;
  rwAttempts: number;
  rwAccuracy: number | null;
  mathAttempts: number;
  mathAccuracy: number | null;
  totalMockTests: number;
  avgMockScore: number | null;
  activeToday: number;
  activeThisWeek: number;
}

// ─── Data access ───

export async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) throw error;
  return data as AdminUserRow[];
}

export async function adminUpdateProfile(
  userId: string,
  fields: { full_name?: string; school?: string; grade_level?: number | null },
) {
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId);
  if (error) throw error;
}

export async function adminDeleteUser(userId: string) {
  const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
  if (error) throw error;
}

export async function fetchQuestionStats(): Promise<QuestionStatsRow[]> {
  const { data, error } = await supabase.rpc('admin_question_stats');
  if (error) throw error;
  return data as QuestionStatsRow[];
}

export async function fetchQuestionErrorBreakdown(questionId: string): Promise<ErrorBreakdownRow[]> {
  const { data, error } = await supabase.rpc('admin_question_error_breakdown', {
    target_question_id: questionId,
  });
  if (error) throw error;
  return data as ErrorBreakdownRow[];
}

export async function fetchUsageStats(): Promise<UsageStats> {
  const { data, error } = await supabase.rpc('admin_usage_stats');
  if (error) throw error;
  return data as UsageStats;
}

// ─── Flags ───

export interface FlagRow {
  id: string;
  user_id: string;
  question_id: string;
  description: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  user_email: string;
  user_name: string;
}

export async function fetchAllFlags(): Promise<FlagRow[]> {
  const { data, error } = await supabase.rpc('admin_list_flags');
  if (error) throw error;
  return data as FlagRow[];
}

export async function adminResolveFlag(flagId: string, resolve: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_resolve_flag', {
    target_flag_id: flagId,
    resolve,
  });
  if (error) throw error;
}
