import { useAppStore } from '../store/useAppStore';
import {
  syncGamificationState,
  upsertUserProgress,
  insertAttempt,
  insertExamWrapper,
  insertMockTest,
} from './database';
import type {
  QuestionProgress,
  ExamWrapperEntry,
  MockTestHistoryEntry,
} from '../types';

let unsubscribe: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

// Track previous state for diff detection
let prevState: ReturnType<typeof useAppStore.getState> | null = null;

// Queue for immediate writes (attempts, exam wrappers, mock tests)
const pendingAttempts: Array<{ questionId: string; attempt: import('../types').Attempt; mode?: string }> = [];
const pendingExamWrappers: ExamWrapperEntry[] = [];
const pendingMockTests: MockTestHistoryEntry[] = [];
const pendingProgressUpserts: Set<string> = new Set();

export function startSyncEngine(userId: string) {
  stopSyncEngine();
  currentUserId = userId;
  prevState = useAppStore.getState();

  unsubscribe = useAppStore.subscribe((state, prev) => {
    if (!currentUserId) return;

    // Detect questionProgress changes — track which questions changed
    if (state.questionProgress !== prev.questionProgress) {
      for (const qid of Object.keys(state.questionProgress)) {
        const curr = state.questionProgress[qid];
        const old = prev.questionProgress[qid];
        if (curr !== old) {
          pendingProgressUpserts.add(qid);

          // Detect new attempts
          const currAttempts = curr?.attempts ?? [];
          const oldAttempts = old?.attempts ?? [];
          if (currAttempts.length > oldAttempts.length) {
            const newAttempt = currAttempts[currAttempts.length - 1];
            pendingAttempts.push({
              questionId: qid,
              attempt: newAttempt,
              mode: state.currentSession?.mode,
            });
          }
        }
      }
    }

    // Detect new exam wrappers
    if (state.examWrappers !== prev.examWrappers && state.examWrappers.length > prev.examWrappers.length) {
      const newWrapper = state.examWrappers[state.examWrappers.length - 1];
      pendingExamWrappers.push(newWrapper);
    }

    // Detect new mock tests
    if (state.mockTestHistory !== prev.mockTestHistory && state.mockTestHistory.length > prev.mockTestHistory.length) {
      const newMock = state.mockTestHistory[state.mockTestHistory.length - 1];
      pendingMockTests.push(newMock);
    }

    // Debounce the flush
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => flushSync(state), 1000);
  });
}

async function flushSync(state: ReturnType<typeof useAppStore.getState>) {
  if (!currentUserId) return;
  const userId = currentUserId;

  try {
    // 1. Flush immediate writes in parallel batches
    const immediateWrites: Promise<void>[] = [];

    while (pendingAttempts.length > 0) {
      const item = pendingAttempts.shift()!;
      immediateWrites.push(insertAttempt(userId, item.questionId, item.attempt, item.mode));
    }
    while (pendingExamWrappers.length > 0) {
      const wrapper = pendingExamWrappers.shift()!;
      immediateWrites.push(insertExamWrapper(userId, wrapper));
    }
    while (pendingMockTests.length > 0) {
      const mock = pendingMockTests.shift()!;
      immediateWrites.push(insertMockTest(userId, mock));
    }

    // Wait for all immediate writes to complete in parallel
    if (immediateWrites.length > 0) {
      await Promise.all(immediateWrites);
    }

    // 2. Upsert changed question progress rows (parallel)
    const progressWrites: Promise<void>[] = [];
    for (const qid of pendingProgressUpserts) {
      const qp: QuestionProgress | undefined = state.questionProgress[qid];
      if (qp) {
        progressWrites.push(upsertUserProgress(userId, qp));
      }
    }
    pendingProgressUpserts.clear();

    if (progressWrites.length > 0) {
      await Promise.all(progressWrites);
    }

    // 3. Sync gamification state (always — it's a single row update)
    const hasGamChanges = !prevState ||
      state.xp !== prevState.xp ||
      state.xpHistory !== prevState.xpHistory ||
      state.earnedBadges !== prevState.earnedBadges ||
      state.sessionsCompleted !== prevState.sessionsCompleted ||
      state.studyStreak !== prevState.studyStreak ||
      state.longestStreak !== prevState.longestStreak ||
      state.lastStudyDate !== prevState.lastStudyDate ||
      state.streakFreezes !== prevState.streakFreezes ||
      state.questProgress !== prevState.questProgress ||
      state.bossesDefeated !== prevState.bossesDefeated ||
      state.sectionQuests !== prevState.sectionQuests ||
      state.calibrationData !== prevState.calibrationData ||
      state.deepDivesCompleted !== prevState.deepDivesCompleted ||
      state.sessionHistory !== prevState.sessionHistory ||
      state.thinkPeriodEnabled !== prevState.thinkPeriodEnabled ||
      state.metacogEnabled !== prevState.metacogEnabled ||
      state.scaffoldingOverrides !== prevState.scaffoldingOverrides ||
      state.hasSeenWelcome !== prevState.hasSeenWelcome;

    if (hasGamChanges) {
      await syncGamificationState(userId, {
        xp: state.xp,
        xpHistory: state.xpHistory,
        earnedBadges: state.earnedBadges,
        sessionsCompleted: state.sessionsCompleted,
        studyStreak: state.studyStreak,
        longestStreak: state.longestStreak,
        lastStudyDate: state.lastStudyDate,
        streakFreezes: state.streakFreezes,
        questProgress: state.questProgress,
        bossesDefeated: state.bossesDefeated,
        sectionQuests: state.sectionQuests,
        calibrationData: state.calibrationData,
        deepDivesCompleted: state.deepDivesCompleted,
        sessionHistory: state.sessionHistory,
        thinkPeriodEnabled: state.thinkPeriodEnabled,
        metacogEnabled: state.metacogEnabled,
        scaffoldingOverrides: state.scaffoldingOverrides,
        hasSeenWelcome: state.hasSeenWelcome,
      });
    }

    prevState = state;
  } catch (err) {
    console.error('Sync error:', err);
  }
}

export function stopSyncEngine() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  currentUserId = null;
  prevState = null;
  pendingAttempts.length = 0;
  pendingExamWrappers.length = 0;
  pendingMockTests.length = 0;
  pendingProgressUpserts.clear();
}
