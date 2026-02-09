import { create } from 'zustand';
import type {
  StudySession,
  QuestionProgress,
  Attempt,
  StudyMode,
  DomainId,
  SectionId,
  Difficulty,
  SM2Rating,
  Badge,
  XPEvent,
  SessionLogEntry,
  ConfidenceRating,
  QuestProgress,
  ExamWrapperEntry,
  CalibrationData,
  MockTestHistoryEntry,
  SectionQuests,
} from '../types';
import { SECTION_DOMAINS } from '../types';
import { calculateMastery } from '../utils/mastery';
import { calculateSM2, defaultSM2Data, computeNextReviewDate } from '../utils/sm2';
import { calculateXPReward } from '../utils/xp';
import { checkNewBadges, BADGE_DEFINITIONS } from '../utils/badges';
import { getQuestionById, allQuestions } from '../data/questions';
import type { UserData } from '../services/database';

interface SessionState {
  mode: StudyMode;
  domainFilter?: DomainId;
  sectionFilter?: SectionId;
  difficultyFilter?: Difficulty;
  timerDuration?: number;
  currentQuestionIds: string[];
  currentIndex: number;
  isActive: boolean;
  startedAt: number;
  delayedFeedback?: boolean;
  bossDomain?: DomainId;
  bossThreshold?: number;
}

interface AppState {
  // Auth/sync state
  userId: string | null;
  isHydrated: boolean;

  // State
  currentSession: SessionState | null;
  questionProgress: Record<string, QuestionProgress>;
  studyStreak: number;
  lastStudyDate: string | null;
  hasSeenWelcome: boolean;

  // Gamification state
  xp: number;
  xpHistory: XPEvent[];
  earnedBadges: Badge[];
  sessionsCompleted: number;
  longestStreak: number;

  // Session history
  sessionHistory: SessionLogEntry[];

  // Streak freezes
  streakFreezes: number;

  // Quests & boss fights
  questProgress: Record<string, QuestProgress>;
  bossesDefeated: string[];

  // Exam wrappers
  examWrappers: ExamWrapperEntry[];

  // Metacognitive calibration
  calibrationData: CalibrationData;

  // Deep dives completed (global counter for badges)
  deepDivesCompleted: number;

  // Settings
  thinkPeriodEnabled: boolean;
  scaffoldingOverrides: Record<string, boolean>;

  // SAT-specific
  mockTestHistory: MockTestHistoryEntry[];
  sectionQuests: SectionQuests;

  // Hydration & clear actions
  hydrateFromSupabase: (userId: string, data: UserData) => void;
  clearUserData: () => void;

  // Actions
  startSession: (session: StudySession, questionIds: string[]) => void;
  submitAnswer: (questionId: string, userAnswer: string | number, correct: boolean, hintsUsed?: number) => void;
  submitConfidence: (questionId: string, rating: ConfidenceRating) => void;
  rateSM2: (questionId: string, rating: SM2Rating) => void;
  completeDeepDive: (questionId: string, correct: boolean) => void;
  submitExamWrapper: (wrapper: ExamWrapperEntry) => void;
  addXP: (event: XPEvent) => void;
  checkAndAwardBadges: () => Badge[];
  nextQuestion: () => void;
  previousQuestion: () => void;
  endSession: () => void;
  resetProgress: () => void;
  setWelcomeSeen: () => void;
  updateStreak: () => void;
  useStreakFreeze: () => boolean;
  updateQuestProgress: (domainId: DomainId) => void;
  defeatBoss: (domainId: DomainId) => void;
  submitSecondChance: (originalQuestionId: string, scQuestionId: string, correct: boolean) => void;
  setThinkPeriodEnabled: (enabled: boolean) => void;
  setScaffoldingOverride: (domainId: DomainId, enabled: boolean) => void;
  addMockTestResult: (entry: MockTestHistoryEntry) => void;
  updateSectionQuests: () => void;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

const initialState = {
  userId: null as string | null,
  isHydrated: false,
  currentSession: null as SessionState | null,
  questionProgress: {} as Record<string, QuestionProgress>,
  studyStreak: 0,
  lastStudyDate: null as string | null,
  hasSeenWelcome: false,
  xp: 0,
  xpHistory: [] as XPEvent[],
  earnedBadges: [] as Badge[],
  sessionsCompleted: 0,
  longestStreak: 0,
  sessionHistory: [] as SessionLogEntry[],
  streakFreezes: 0,
  questProgress: {} as Record<string, QuestProgress>,
  bossesDefeated: [] as string[],
  examWrappers: [] as ExamWrapperEntry[],
  calibrationData: { recentAttempts: [] } as CalibrationData,
  deepDivesCompleted: 0,
  thinkPeriodEnabled: true,
  scaffoldingOverrides: {} as Record<string, boolean>,
  mockTestHistory: [] as MockTestHistoryEntry[],
  sectionQuests: {
    readingWritingComplete: false,
    mathComplete: false,
    satReady: false,
  } as SectionQuests,
};

export const useAppStore = create<AppState>()(
  (set, get) => ({
    ...initialState,

    hydrateFromSupabase: (userId, data) =>
      set({
        userId,
        isHydrated: true,
        questionProgress: data.questionProgress,
        xp: data.xp,
        xpHistory: data.xpHistory,
        earnedBadges: data.earnedBadges,
        sessionsCompleted: data.sessionsCompleted,
        studyStreak: data.studyStreak,
        longestStreak: data.longestStreak,
        lastStudyDate: data.lastStudyDate,
        streakFreezes: data.streakFreezes,
        questProgress: data.questProgress,
        bossesDefeated: data.bossesDefeated,
        sectionQuests: data.sectionQuests,
        calibrationData: data.calibrationData,
        deepDivesCompleted: data.deepDivesCompleted,
        sessionHistory: data.sessionHistory,
        thinkPeriodEnabled: data.thinkPeriodEnabled,
        scaffoldingOverrides: data.scaffoldingOverrides,
        hasSeenWelcome: data.hasSeenWelcome,
        examWrappers: data.examWrappers,
        mockTestHistory: data.mockTestHistory,
      }),

    clearUserData: () =>
      set({
        ...initialState,
      }),

    startSession: (session, questionIds) =>
      set({
        currentSession: {
          mode: session.mode,
          domainFilter: session.domainFilter,
          sectionFilter: session.sectionFilter,
          difficultyFilter: session.difficultyFilter,
          timerDuration: session.timerDuration,
          currentQuestionIds: questionIds,
          currentIndex: 0,
          isActive: true,
          startedAt: Date.now(),
          delayedFeedback: session.mode === 'timed-module',
        },
      }),

    submitAnswer: (questionId, userAnswer, correct, hintsUsed = 0) =>
      set((state) => {
        const existing = state.questionProgress[questionId];
        const newAttempt: Attempt = {
          timestamp: Date.now(),
          correct,
          userAnswer,
          hintsUsed,
        };

        const attempts = existing
          ? [...existing.attempts, newAttempt]
          : [newAttempt];

        const updatedProgress: QuestionProgress = {
          questionId,
          attempts,
          masteryLevel: calculateMastery(attempts),
          lastAttempted: Date.now(),
          sm2: existing?.sm2 ?? defaultSM2Data(),
        };

        const question = getQuestionById(questionId);
        const isFirstAttempt = !existing || existing.attempts.length === 0;
        const isOverdue = existing?.sm2?.nextReviewDate
          ? new Date(existing.sm2.nextReviewDate) <= new Date()
          : false;

        let xpAmount = calculateXPReward({
          correct,
          difficulty: question?.difficulty ?? 'medium',
          isFirstAttempt,
          isOverdue,
        });

        // Grid-in bonus: +3 XP for correct grid-in
        if (correct && question?.type === 'grid-in') {
          xpAmount += 3;
        }

        // Scale XP based on hints used (100% / 60% / 30% / 0%)
        if (hintsUsed === 1) xpAmount = Math.round(xpAmount * 0.6);
        else if (hintsUsed === 2) xpAmount = Math.round(xpAmount * 0.3);
        else if (hintsUsed >= 3) xpAmount = 0;

        const xpEvent: XPEvent = {
          amount: xpAmount,
          reason: correct ? 'Correct answer' : 'Attempted question',
          timestamp: Date.now(),
          questionId,
        };

        return {
          questionProgress: {
            ...state.questionProgress,
            [questionId]: updatedProgress,
          },
          xp: state.xp + xpAmount,
          xpHistory: xpAmount > 0 ? [...state.xpHistory, xpEvent] : state.xpHistory,
        };
      }),

    submitConfidence: (questionId, rating) =>
      set((state) => {
        const existing = state.questionProgress[questionId];
        if (!existing || existing.attempts.length === 0) return {};

        const attempts = [...existing.attempts];
        const lastAttempt = { ...attempts[attempts.length - 1], confidenceRating: rating };
        attempts[attempts.length - 1] = lastAttempt;

        const confident = rating >= 4;
        const correct = lastAttempt.correct;
        const calibrationEntry = {
          confident,
          correct,
          timestamp: Date.now(),
        };

        const recentAttempts = [
          ...state.calibrationData.recentAttempts,
          calibrationEntry,
        ].slice(-50);

        const wellCalibrated = (confident && correct) || (!confident && !correct);
        let xpBonus = 0;
        if (wellCalibrated) {
          xpBonus = 3;
        }

        return {
          questionProgress: {
            ...state.questionProgress,
            [questionId]: { ...existing, attempts },
          },
          calibrationData: { recentAttempts },
          xp: state.xp + xpBonus,
          xpHistory: xpBonus > 0
            ? [...state.xpHistory, { amount: xpBonus, reason: 'Well-calibrated confidence', timestamp: Date.now(), questionId }]
            : state.xpHistory,
        };
      }),

    rateSM2: (questionId, rating) =>
      set((state) => {
        const existing = state.questionProgress[questionId];
        if (!existing) return {};

        const prev = existing.sm2 ?? defaultSM2Data();
        const result = calculateSM2(
          rating,
          prev.easeFactor,
          prev.interval,
          prev.repetition,
        );

        const nextReviewDate = result.interval > 0
          ? computeNextReviewDate(result.interval)
          : null;

        return {
          questionProgress: {
            ...state.questionProgress,
            [questionId]: {
              ...existing,
              sm2: {
                easeFactor: result.easeFactor,
                interval: result.interval,
                repetition: result.repetition,
                nextReviewDate,
              },
            },
          },
        };
      }),

    completeDeepDive: (questionId, correct) =>
      set((state) => {
        const existing = state.questionProgress[questionId];
        if (!existing || existing.attempts.length === 0) return {};

        const attempts = [...existing.attempts];
        const lastAttempt = {
          ...attempts[attempts.length - 1],
          deepDiveCompleted: true,
          deepDiveCorrect: correct,
        };
        attempts[attempts.length - 1] = lastAttempt;

        const xpAmount = correct ? 8 : 2;

        return {
          questionProgress: {
            ...state.questionProgress,
            [questionId]: { ...existing, attempts },
          },
          deepDivesCompleted: state.deepDivesCompleted + 1,
          xp: state.xp + xpAmount,
          xpHistory: [
            ...state.xpHistory,
            { amount: xpAmount, reason: 'Deep Dive completed', timestamp: Date.now(), questionId },
          ],
        };
      }),

    submitExamWrapper: (wrapper) =>
      set((state) => ({
        examWrappers: [...state.examWrappers, wrapper],
        xp: state.xp + 15,
        xpHistory: [
          ...state.xpHistory,
          { amount: 15, reason: 'Exam Wrapper completed', timestamp: Date.now() },
        ],
      })),

    addXP: (event) =>
      set((state) => ({
        xp: state.xp + event.amount,
        xpHistory: [...state.xpHistory, event],
      })),

    checkAndAwardBadges: () => {
      const state = get();
      const earnedIds = state.earnedBadges.map((b) => b.id);
      const newBadgeIds = checkNewBadges(
        {
          questionProgress: state.questionProgress,
          xp: state.xp,
          earnedBadges: earnedIds,
          sessionsCompleted: state.sessionsCompleted,
          studyStreak: state.studyStreak,
          longestStreak: state.longestStreak,
          deepDivesCompleted: state.deepDivesCompleted,
          bossesDefeated: state.bossesDefeated,
          mockTestHistory: state.mockTestHistory,
        },
        earnedIds,
      );

      if (newBadgeIds.length === 0) return [];

      const newBadges: Badge[] = newBadgeIds.map((id) => {
        const def = BADGE_DEFINITIONS.find((d) => d.id === id)!;
        return {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earnedAt: Date.now(),
        };
      });

      set((state) => ({
        earnedBadges: [...state.earnedBadges, ...newBadges],
      }));

      return newBadges;
    },

    nextQuestion: () =>
      set((state) => {
        if (!state.currentSession) return {};
        const nextIndex = state.currentSession.currentIndex + 1;
        if (nextIndex >= state.currentSession.currentQuestionIds.length) return {};
        return {
          currentSession: {
            ...state.currentSession,
            currentIndex: nextIndex,
          },
        };
      }),

    previousQuestion: () =>
      set((state) => {
        if (!state.currentSession) return {};
        const prevIndex = state.currentSession.currentIndex - 1;
        if (prevIndex < 0) return {};
        return {
          currentSession: {
            ...state.currentSession,
            currentIndex: prevIndex,
          },
        };
      }),

    endSession: () =>
      set((state) => {
        const newSessionsCompleted = state.sessionsCompleted + 1;
        const newLongestStreak = Math.max(state.longestStreak, state.studyStreak);

        const newStreakFreezes = newLongestStreak >= 7 && state.studyStreak % 7 === 0
          ? state.streakFreezes + 1
          : state.streakFreezes;

        let logEntry: SessionLogEntry | null = null;
        if (state.currentSession) {
          const ids = state.currentSession.currentQuestionIds;
          let answered = 0;
          let correct = 0;
          for (const id of ids) {
            const qp = state.questionProgress[id];
            if (qp && qp.lastAttempted >= state.currentSession.startedAt) {
              answered++;
              const sessionAttempts = qp.attempts.filter(
                (a) => a.timestamp >= state.currentSession!.startedAt,
              );
              if (sessionAttempts.length > 0 && sessionAttempts[sessionAttempts.length - 1].correct) {
                correct++;
              }
            }
          }
          if (answered > 0) {
            logEntry = {
              timestamp: state.currentSession.startedAt,
              mode: state.currentSession.mode,
              questionsAnswered: answered,
              correctAnswers: correct,
              score: Math.round((correct / answered) * 100),
            };
          }
        }

        return {
          currentSession: null,
          sessionsCompleted: newSessionsCompleted,
          longestStreak: newLongestStreak,
          streakFreezes: newStreakFreezes,
          sessionHistory: logEntry
            ? [...state.sessionHistory, logEntry]
            : state.sessionHistory,
        };
      }),

    resetProgress: () =>
      set((state) => ({
        questionProgress: {},
        studyStreak: 0,
        lastStudyDate: null,
        xp: 0,
        xpHistory: [],
        earnedBadges: [],
        sessionsCompleted: 0,
        longestStreak: 0,
        sessionHistory: [],
        streakFreezes: 0,
        questProgress: {},
        bossesDefeated: [],
        examWrappers: [],
        calibrationData: { recentAttempts: [] },
        deepDivesCompleted: 0,
        scaffoldingOverrides: {},
        mockTestHistory: [],
        sectionQuests: {
          readingWritingComplete: false,
          mathComplete: false,
          satReady: false,
        },
        // Keep userId and isHydrated
        userId: state.userId,
        isHydrated: state.isHydrated,
      })),

    setWelcomeSeen: () =>
      set({
        hasSeenWelcome: true,
      }),

    updateStreak: () =>
      set((state) => {
        const today = getTodayString();

        if (state.lastStudyDate === today) {
          return {};
        }

        if (state.lastStudyDate) {
          const lastDate = new Date(state.lastStudyDate);
          const todayDate = new Date(today);
          const diffMs = todayDate.getTime() - lastDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (diffDays === 1) {
            return {
              studyStreak: state.studyStreak + 1,
              lastStudyDate: today,
            };
          } else if (diffDays === 2 && state.streakFreezes > 0) {
            return {
              studyStreak: state.studyStreak + 1,
              lastStudyDate: today,
              streakFreezes: state.streakFreezes - 1,
            };
          } else {
            return {
              studyStreak: 1,
              lastStudyDate: today,
            };
          }
        }

        return {
          studyStreak: 1,
          lastStudyDate: today,
        };
      }),

    useStreakFreeze: () => {
      const state = get();
      if (state.streakFreezes <= 0) return false;
      set({ streakFreezes: state.streakFreezes - 1 });
      return true;
    },

    updateQuestProgress: (domainId) =>
      set((state) => {
        const domainQuestions = allQuestions.filter((q) => q.domain === domainId);
        const progress = state.questionProgress;

        let answered = 0;
        let correct = 0;
        let deepDives = 0;
        let masteredCount = 0;

        for (const q of domainQuestions) {
          const qp = progress[q.id];
          if (qp && qp.attempts.length > 0) {
            answered++;
            correct += qp.attempts.filter((a) => a.correct).length;
            if (qp.masteryLevel >= 3) masteredCount++;
            const ddAttempts = qp.attempts.filter((a) => a.deepDiveCompleted);
            deepDives += ddAttempts.length;
          }
        }

        const totalAttempts = Object.values(progress)
          .filter((qp) => domainQuestions.some((q) => q.id === qp.questionId))
          .reduce((sum, qp) => sum + qp.attempts.length, 0);

        const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
        const masteryThresholdMet = masteredCount >= Math.ceil(domainQuestions.length * 0.5);

        const existing = state.questProgress[domainId];
        const completed = answered >= domainQuestions.length && accuracy >= 70 && masteryThresholdMet;

        return {
          questProgress: {
            ...state.questProgress,
            [domainId]: {
              questionsAnswered: answered,
              accuracyPercent: accuracy,
              deepDivesCompleted: deepDives,
              masteryThresholdMet,
              completed,
              completedDate: completed && !existing?.completed ? Date.now() : existing?.completedDate,
            },
          },
        };
      }),

    defeatBoss: (domainId) =>
      set((state) => {
        if (state.bossesDefeated.includes(domainId)) return {};
        return {
          bossesDefeated: [...state.bossesDefeated, domainId],
          xp: state.xp + 50,
          xpHistory: [
            ...state.xpHistory,
            { amount: 50, reason: `Boss defeated: ${domainId}`, timestamp: Date.now() },
          ],
        };
      }),

    submitSecondChance: (originalQuestionId, scQuestionId, correct) =>
      set((state) => {
        const existing = state.questionProgress[originalQuestionId];
        if (!existing || existing.attempts.length === 0) return {};

        const attempts = [...existing.attempts];
        const lastAttempt = {
          ...attempts[attempts.length - 1],
          secondChanceQuestionId: scQuestionId,
          secondChanceCorrect: correct,
        };
        attempts[attempts.length - 1] = lastAttempt;

        let xpAmount = 0;
        if (correct) {
          const question = getQuestionById(scQuestionId);
          const multiplier = question?.difficulty === 'hard' ? 2 : question?.difficulty === 'medium' ? 1.5 : 1;
          xpAmount = Math.round(2 * 2 * multiplier);
        }

        return {
          questionProgress: {
            ...state.questionProgress,
            [originalQuestionId]: { ...existing, attempts },
          },
          xp: state.xp + xpAmount,
          xpHistory: xpAmount > 0
            ? [...state.xpHistory, { amount: xpAmount, reason: '2nd Chance correct', timestamp: Date.now(), questionId: scQuestionId }]
            : state.xpHistory,
        };
      }),

    setThinkPeriodEnabled: (enabled) =>
      set({ thinkPeriodEnabled: enabled }),

    setScaffoldingOverride: (domainId, enabled) =>
      set((state) => ({
        scaffoldingOverrides: {
          ...state.scaffoldingOverrides,
          [domainId]: enabled,
        },
      })),

    addMockTestResult: (entry) =>
      set((state) => ({
        mockTestHistory: [...state.mockTestHistory, entry],
        xp: state.xp + 25,
        xpHistory: [
          ...state.xpHistory,
          { amount: 25, reason: 'Mock test completed', timestamp: Date.now() },
        ],
      })),

    updateSectionQuests: () =>
      set((state) => {
        const questProg = state.questProgress;

        const rwDomains = SECTION_DOMAINS['reading-writing'];
        const mathDomains = SECTION_DOMAINS['math'];

        const rwComplete = rwDomains.every((d) => questProg[d]?.completed);
        const mathComplete = mathDomains.every((d) => questProg[d]?.completed);
        const satReady = rwComplete && mathComplete;

        return {
          sectionQuests: {
            readingWritingComplete: rwComplete,
            mathComplete,
            satReady,
          },
        };
      }),
  }),
);
