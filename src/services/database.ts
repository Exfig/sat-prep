import { supabase } from '../lib/supabase';
import type {
  QuestionProgress,
  XPEvent,
  Badge,
  SessionLogEntry,
  QuestProgress,
  ExamWrapperEntry,
  CalibrationData,
  MockTestHistoryEntry,
  SectionQuests,
  Attempt,
} from '../types';

// Shape returned by loadAllUserData, matching the Zustand state keys
export interface UserData {
  questionProgress: Record<string, QuestionProgress>;
  xp: number;
  xpHistory: XPEvent[];
  earnedBadges: Badge[];
  sessionsCompleted: number;
  studyStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  streakFreezes: number;
  questProgress: Record<string, QuestProgress>;
  bossesDefeated: string[];
  sectionQuests: SectionQuests;
  calibrationData: CalibrationData;
  deepDivesCompleted: number;
  sessionHistory: SessionLogEntry[];
  thinkPeriodEnabled: boolean;
  metacogEnabled: boolean;
  scaffoldingOverrides: Record<string, boolean>;
  hasSeenWelcome: boolean;
  examWrappers: ExamWrapperEntry[];
  mockTestHistory: MockTestHistoryEntry[];
}

// ─── Load all user data (called on login) ───

export async function loadAllUserData(userId: string): Promise<UserData> {
  const [progressRes, gamRes, wrappersRes, mockRes, attemptsRes] = await Promise.all([
    supabase.from('user_progress').select('*').eq('user_id', userId),
    supabase.from('gamification_state').select('*').eq('id', userId).single(),
    supabase.from('exam_wrappers').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('mock_tests').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('attempts').select('*').eq('user_id', userId).order('created_at'),
  ]);

  // Build questionProgress from user_progress rows + attempts
  const questionProgress: Record<string, QuestionProgress> = {};

  // Group attempts by question_id
  const attemptsByQuestion: Record<string, Attempt[]> = {};
  if (attemptsRes.data) {
    for (const row of attemptsRes.data) {
      const qid = row.question_id as string;
      if (!attemptsByQuestion[qid]) attemptsByQuestion[qid] = [];
      attemptsByQuestion[qid].push({
        timestamp: new Date(row.created_at as string).getTime(),
        correct: row.correct as boolean,
        userAnswer: row.user_answer as string,
        confidenceRating: row.confidence_rating as Attempt['confidenceRating'],
        hintsUsed: row.hints_used as number,
        deepDiveCompleted: row.deep_dive_completed as boolean,
        deepDiveCorrect: row.deep_dive_correct as Attempt['deepDiveCorrect'],
        errorCategory: row.error_category as Attempt['errorCategory'],
        secondChanceQuestionId: row.second_chance_question_id as Attempt['secondChanceQuestionId'],
        secondChanceCorrect: row.second_chance_correct as Attempt['secondChanceCorrect'],
        sm2Rating: row.sm2_rating as Attempt['sm2Rating'],
      });
    }
  }

  if (progressRes.data) {
    for (const row of progressRes.data) {
      const qid = row.question_id as string;
      questionProgress[qid] = {
        questionId: qid,
        attempts: attemptsByQuestion[qid] ?? [],
        masteryLevel: row.mastery_level as number,
        lastAttempted: row.last_attempted ? new Date(row.last_attempted as string).getTime() : 0,
        sm2: {
          easeFactor: row.ease_factor as number,
          interval: row.interval as number,
          repetition: row.repetition as number,
          nextReviewDate: row.next_review_date as string | null,
        },
      };
    }
  }

  // Parse gamification_state
  const gam = gamRes.data;
  const settings = (gam?.settings ?? { thinkPeriodEnabled: true, metacogEnabled: true, scaffoldingOverrides: {}, hasSeenWelcome: false }) as {
    thinkPeriodEnabled: boolean;
    metacogEnabled: boolean;
    scaffoldingOverrides: Record<string, boolean>;
    hasSeenWelcome: boolean;
  };

  // Parse exam wrappers
  const examWrappers: ExamWrapperEntry[] = (wrappersRes.data ?? []).map((row) => ({
    sessionTimestamp: row.session_timestamp as number,
    date: row.date as number,
    errorBreakdown: row.error_breakdown as ExamWrapperEntry['errorBreakdown'],
  }));

  // Parse mock tests
  const mockTestHistory: MockTestHistoryEntry[] = (mockRes.data ?? []).map((row) => ({
    timestamp: row.timestamp as number,
    score: row.score as MockTestHistoryEntry['score'],
    modules: row.modules as MockTestHistoryEntry['modules'],
    duration: row.duration as number,
  }));

  return {
    questionProgress,
    xp: (gam?.xp as number) ?? 0,
    xpHistory: (gam?.xp_history as XPEvent[]) ?? [],
    earnedBadges: (gam?.earned_badges as Badge[]) ?? [],
    sessionsCompleted: (gam?.sessions_completed as number) ?? 0,
    studyStreak: (gam?.study_streak as number) ?? 0,
    longestStreak: (gam?.longest_streak as number) ?? 0,
    lastStudyDate: gam?.last_study_date ? String(gam.last_study_date) : null,
    streakFreezes: (gam?.streak_freezes as number) ?? 0,
    questProgress: (gam?.quest_progress as Record<string, QuestProgress>) ?? {},
    bossesDefeated: (gam?.bosses_defeated as string[]) ?? [],
    sectionQuests: (gam?.section_quests as SectionQuests) ?? { readingWritingComplete: false, mathComplete: false, satReady: false },
    calibrationData: (gam?.calibration_data as CalibrationData) ?? { recentAttempts: [] },
    deepDivesCompleted: (gam?.deep_dives_completed as number) ?? 0,
    sessionHistory: (gam?.session_history as SessionLogEntry[]) ?? [],
    thinkPeriodEnabled: settings.thinkPeriodEnabled ?? true,
    metacogEnabled: settings.metacogEnabled ?? true,
    scaffoldingOverrides: settings.scaffoldingOverrides ?? {},
    hasSeenWelcome: settings.hasSeenWelcome ?? false,
    examWrappers,
    mockTestHistory,
  };
}

// ─── Sync: Gamification state (bulk update) ───

export async function syncGamificationState(userId: string, data: {
  xp: number;
  xpHistory: XPEvent[];
  earnedBadges: Badge[];
  sessionsCompleted: number;
  studyStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  streakFreezes: number;
  questProgress: Record<string, QuestProgress>;
  bossesDefeated: string[];
  sectionQuests: SectionQuests;
  calibrationData: CalibrationData;
  deepDivesCompleted: number;
  sessionHistory: SessionLogEntry[];
  thinkPeriodEnabled: boolean;
  metacogEnabled: boolean;
  scaffoldingOverrides: Record<string, boolean>;
  hasSeenWelcome: boolean;
}) {
  const { error } = await supabase.from('gamification_state').update({
    xp: data.xp,
    xp_history: data.xpHistory,
    earned_badges: data.earnedBadges,
    sessions_completed: data.sessionsCompleted,
    study_streak: data.studyStreak,
    longest_streak: data.longestStreak,
    last_study_date: data.lastStudyDate,
    streak_freezes: data.streakFreezes,
    quest_progress: data.questProgress,
    bosses_defeated: data.bossesDefeated,
    section_quests: data.sectionQuests,
    calibration_data: data.calibrationData,
    deep_dives_completed: data.deepDivesCompleted,
    session_history: data.sessionHistory,
    settings: {
      thinkPeriodEnabled: data.thinkPeriodEnabled,
      metacogEnabled: data.metacogEnabled,
      scaffoldingOverrides: data.scaffoldingOverrides,
      hasSeenWelcome: data.hasSeenWelcome,
    },
  }).eq('id', userId);

  if (error) console.error('syncGamificationState error:', error);
}

// ─── Sync: Upsert a single user_progress row ───

export async function upsertUserProgress(userId: string, qp: QuestionProgress) {
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    question_id: qp.questionId,
    mastery_level: qp.masteryLevel,
    ease_factor: qp.sm2.easeFactor,
    interval: qp.sm2.interval,
    repetition: qp.sm2.repetition,
    next_review_date: qp.sm2.nextReviewDate,
    last_attempted: qp.lastAttempted ? new Date(qp.lastAttempted).toISOString() : null,
  }, { onConflict: 'user_id,question_id' });

  if (error) console.error('upsertUserProgress error:', error);
}

// ─── Sync: Insert a single attempt row ───

export async function insertAttempt(userId: string, questionId: string, attempt: Attempt, mode?: string) {
  const { error } = await supabase.from('attempts').insert({
    user_id: userId,
    question_id: questionId,
    correct: attempt.correct,
    user_answer: String(attempt.userAnswer),
    confidence_rating: attempt.confidenceRating ?? null,
    hints_used: attempt.hintsUsed ?? 0,
    deep_dive_completed: attempt.deepDiveCompleted ?? false,
    deep_dive_correct: attempt.deepDiveCorrect ?? null,
    error_category: attempt.errorCategory ?? null,
    second_chance_question_id: attempt.secondChanceQuestionId ?? null,
    second_chance_correct: attempt.secondChanceCorrect ?? null,
    sm2_rating: attempt.sm2Rating ?? null,
    mode: mode ?? null,
  });

  if (error) console.error('insertAttempt error:', error);
}

// ─── Sync: Insert exam wrapper ───

export async function insertExamWrapper(userId: string, wrapper: ExamWrapperEntry) {
  const { error } = await supabase.from('exam_wrappers').insert({
    user_id: userId,
    session_timestamp: wrapper.sessionTimestamp,
    date: wrapper.date,
    error_breakdown: wrapper.errorBreakdown,
  });

  if (error) console.error('insertExamWrapper error:', error);
}

// ─── Sync: Insert mock test ───

export async function insertMockTest(userId: string, entry: MockTestHistoryEntry) {
  const { error } = await supabase.from('mock_tests').insert({
    user_id: userId,
    timestamp: entry.timestamp,
    score: entry.score,
    modules: entry.modules,
    duration: entry.duration,
  });

  if (error) console.error('insertMockTest error:', error);
}

// ─── Profile operations ───

export interface ProfileData {
  full_name: string | null;
  school: string | null;
  grade_level: number | null;
  target_test_date: string | null;
}

export async function loadProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, school, grade_level, target_test_date')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('loadProfile error:', error);
    return null;
  }
  return data as ProfileData;
}

export async function updateProfile(userId: string, profile: Partial<ProfileData>) {
  const { error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId);

  if (error) console.error('updateProfile error:', error);
}

// ─── Export all user data as JSON ───

export async function exportAllUserData(userId: string): Promise<string> {
  const data = await loadAllUserData(userId);
  const profile = await loadProfile(userId);
  return JSON.stringify({ profile, ...data }, null, 2);
}

// ─── Delete user account ───

export async function deleteUserAccount() {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}
