import type { Attempt, QuestionProgress, SM2Data } from '../types';

/**
 * Calculate mastery level (0-3) based on consecutive correct answers.
 * 0 = no attempts
 * 1 = 1 correct (most recent)
 * 2 = 2 consecutive correct (most recent)
 * 3 = 3+ consecutive correct = mastered
 */
export function calculateMastery(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  // Count consecutive correct answers from most recent
  let consecutive = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].correct) {
      consecutive++;
    } else {
      break;
    }
  }

  return Math.min(consecutive, 3);
}

export function isMastered(questionProgress: QuestionProgress): boolean {
  return questionProgress.masteryLevel >= 3;
}

export function masteryFromSM2(sm2: SM2Data): number {
  if (sm2.repetition === 0) return 0;
  if (sm2.repetition === 1) return 1;
  if (sm2.repetition <= 3) return 2;
  return 3;
}
