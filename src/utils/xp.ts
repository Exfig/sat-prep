import type { LevelInfo, Difficulty } from '../types';

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Test Taker', xpRequired: 0 },
  { level: 2, title: 'Study Starter', xpRequired: 100 },
  { level: 3, title: 'Score Builder', xpRequired: 250 },
  { level: 4, title: 'Strategy Learner', xpRequired: 500 },
  { level: 5, title: 'Section Specialist', xpRequired: 800 },
  { level: 6, title: 'Practice Pro', xpRequired: 1200 },
  { level: 7, title: 'SAT Scholar', xpRequired: 1800 },
  { level: 8, title: 'Score Climber', xpRequired: 2800 },
  { level: 9, title: 'Elite Scorer', xpRequired: 4000 },
  { level: 10, title: 'SAT Champion', xpRequired: 5000 },
];

export function calculateXPReward({
  correct,
  difficulty,
  isFirstAttempt,
  isOverdue,
}: {
  correct: boolean;
  difficulty: Difficulty;
  isFirstAttempt: boolean;
  isOverdue?: boolean;
}): number {
  let base = correct ? 10 : 2;

  const multiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
  base *= multiplier;

  if (correct && isFirstAttempt) base += 5;
  if (isOverdue) base += 3;

  return Math.round(base);
}

export function getLevelForXP(totalXP: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getXPToNextLevel(totalXP: number): {
  current: number;
  needed: number;
  progress: number;
} {
  const currentLevel = getLevelForXP(totalXP);
  const currentIdx = LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = LEVELS[currentIdx + 1];

  if (!nextLevel) {
    return { current: 0, needed: 0, progress: 1 };
  }

  const current = totalXP - currentLevel.xpRequired;
  const needed = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = needed > 0 ? current / needed : 1;

  return { current, needed, progress };
}
