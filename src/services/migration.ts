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
} from '../types';
import type { UserData } from './database';

const STORAGE_KEY = 'sat-prep-progress';

interface LocalStorageData {
  state: {
    questionProgress: Record<string, QuestionProgress>;
    studyStreak: number;
    lastStudyDate: string | null;
    hasSeenWelcome: boolean;
    xp: number;
    xpHistory: XPEvent[];
    earnedBadges: Badge[];
    sessionsCompleted: number;
    longestStreak: number;
    sessionHistory: SessionLogEntry[];
    streakFreezes: number;
    questProgress: Record<string, QuestProgress>;
    bossesDefeated: string[];
    examWrappers: ExamWrapperEntry[];
    calibrationData: CalibrationData;
    deepDivesCompleted: number;
    thinkPeriodEnabled: boolean;
    metacogEnabled: boolean;
    scaffoldingOverrides: Record<string, boolean>;
    mockTestHistory: MockTestHistoryEntry[];
    sectionQuests: SectionQuests;
  };
  version: number;
}

export function hasLocalStorageData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function parseLocalStorageData(): UserData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalStorageData;
    const s = parsed.state;

    return {
      questionProgress: s.questionProgress ?? {},
      xp: s.xp ?? 0,
      xpHistory: s.xpHistory ?? [],
      earnedBadges: s.earnedBadges ?? [],
      sessionsCompleted: s.sessionsCompleted ?? 0,
      studyStreak: s.studyStreak ?? 0,
      longestStreak: s.longestStreak ?? 0,
      lastStudyDate: s.lastStudyDate ?? null,
      streakFreezes: s.streakFreezes ?? 0,
      questProgress: s.questProgress ?? {},
      bossesDefeated: s.bossesDefeated ?? [],
      sectionQuests: s.sectionQuests ?? { readingWritingComplete: false, mathComplete: false, satReady: false },
      calibrationData: s.calibrationData ?? { recentAttempts: [] },
      deepDivesCompleted: s.deepDivesCompleted ?? 0,
      sessionHistory: s.sessionHistory ?? [],
      thinkPeriodEnabled: s.thinkPeriodEnabled ?? true,
      metacogEnabled: s.metacogEnabled ?? true,
      scaffoldingOverrides: s.scaffoldingOverrides ?? {},
      hasSeenWelcome: s.hasSeenWelcome ?? false,
      examWrappers: s.examWrappers ?? [],
      mockTestHistory: s.mockTestHistory ?? [],
    };
  } catch {
    return null;
  }
}

export function clearLocalStorageData() {
  localStorage.removeItem(STORAGE_KEY);
}
