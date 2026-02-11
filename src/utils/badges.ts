import type { DomainId, QuestionProgress, MockTestHistoryEntry } from '../types';
import { ALL_DOMAIN_IDS, DOMAIN_NAMES } from '../types';
import { getQuestionsByDomain, getQuestionsByType } from '../data/questions';
import { LEVELS } from './xp';

// ─── Badge check state ────────────────────────────────────────────────────────

export interface BadgeCheckState {
  questionProgress: Record<string, QuestionProgress>;
  xp: number;
  earnedBadges: string[];
  sessionsCompleted: number;
  studyStreak: number;
  longestStreak: number;
  deepDivesCompleted: number;
  bossesDefeated: string[];
  mockTestHistory: MockTestHistoryEntry[];
  strategyGuideCompleted: boolean;
}

// ─── Badge definition ─────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (state: BadgeCheckState) => boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function domainAttempted(
  domainId: DomainId,
  progress: Record<string, QuestionProgress>,
): { attempted: number; correct: number; total: number; mastered: number } {
  const domainQs = getQuestionsByDomain(domainId);
  let attempted = 0;
  let correct = 0;
  let mastered = 0;

  for (const q of domainQs) {
    const qp = progress[q.id];
    if (qp && qp.attempts.length > 0) {
      attempted++;
      if (qp.attempts[qp.attempts.length - 1].correct) correct++;
      if (qp.masteryLevel >= 3) mastered++;
    }
  }

  return { attempted, correct, total: domainQs.length, mastered };
}

// XP thresholds matching SAT levels from xp.ts
const XP_THRESHOLDS = LEVELS.map((l) => l.xpRequired);
// [0, 100, 250, 500, 800, 1200, 1800, 2800, 4000, 5000]

// ─── Badge definitions ────────────────────────────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── First steps ────────────────────────────────────────────────────────────
  {
    id: 'first-question',
    name: 'First Step',
    description: 'Answer your first question',
    icon: '🎯',
    check: (s) => Object.keys(s.questionProgress).length >= 1,
  },
  {
    id: 'first-session',
    name: 'Study Session',
    description: 'Complete your first study session',
    icon: '📝',
    check: (s) => s.sessionsCompleted >= 1,
  },

  // ── Milestone badges ──────────────────────────────────────────────────────
  {
    id: 'answer-25',
    name: 'Getting Warmed Up',
    description: 'Answer 25 questions',
    icon: '🔥',
    check: (s) => {
      let count = 0;
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.attempts.length > 0) count++;
      }
      return count >= 25;
    },
  },
  {
    id: 'answer-100',
    name: 'Century Club',
    description: 'Answer 100 questions',
    icon: '💯',
    check: (s) => {
      let count = 0;
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.attempts.length > 0) count++;
      }
      return count >= 100;
    },
  },
  {
    id: 'answer-250',
    name: 'Dedicated Student',
    description: 'Answer 250 questions',
    icon: '📚',
    check: (s) => {
      let count = 0;
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.attempts.length > 0) count++;
      }
      return count >= 250;
    },
  },

  // ── Accuracy badges ────────────────────────────────────────────────────────
  {
    id: 'perfect-10',
    name: 'Perfect 10',
    description: 'Get 10 questions correct in a row',
    icon: '⭐',
    check: (s) => {
      const attempts = Object.values(s.questionProgress)
        .flatMap((qp) => qp.attempts)
        .sort((a, b) => a.timestamp - b.timestamp);
      let streak = 0;
      for (const a of attempts) {
        if (a.correct) {
          streak++;
          if (streak >= 10) return true;
        } else {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'perfect-25',
    name: 'On Fire',
    description: 'Get 25 questions correct in a row',
    icon: '🌟',
    check: (s) => {
      const attempts = Object.values(s.questionProgress)
        .flatMap((qp) => qp.attempts)
        .sort((a, b) => a.timestamp - b.timestamp);
      let streak = 0;
      for (const a of attempts) {
        if (a.correct) {
          streak++;
          if (streak >= 25) return true;
        } else {
          streak = 0;
        }
      }
      return false;
    },
  },

  // ── Study streak badges ────────────────────────────────────────────────────
  {
    id: 'streak-3',
    name: 'Hat Trick',
    description: 'Study 3 days in a row',
    icon: '🎩',
    check: (s) => s.longestStreak >= 3 || s.studyStreak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Study 7 days in a row',
    icon: '🗓️',
    check: (s) => s.longestStreak >= 7 || s.studyStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Study 30 days in a row',
    icon: '🏆',
    check: (s) => s.longestStreak >= 30 || s.studyStreak >= 30,
  },

  // ── XP / Level badges ─────────────────────────────────────────────────────
  {
    id: 'xp-100',
    name: 'XP Earner',
    description: `Earn ${XP_THRESHOLDS[1]} XP`,
    icon: '✨',
    check: (s) => s.xp >= XP_THRESHOLDS[1], // 100
  },
  {
    id: 'xp-500',
    name: 'XP Collector',
    description: `Earn ${XP_THRESHOLDS[3]} XP`,
    icon: '💎',
    check: (s) => s.xp >= XP_THRESHOLDS[3], // 500
  },
  {
    id: 'xp-1200',
    name: 'XP Hoarder',
    description: `Earn ${XP_THRESHOLDS[5]} XP`,
    icon: '🏅',
    check: (s) => s.xp >= XP_THRESHOLDS[5], // 1200
  },
  {
    id: 'xp-5000',
    name: 'XP Legend',
    description: `Earn ${XP_THRESHOLDS[9]} XP`,
    icon: '👑',
    check: (s) => s.xp >= XP_THRESHOLDS[9], // 5000
  },

  // ── Session badges ─────────────────────────────────────────────────────────
  {
    id: 'sessions-5',
    name: 'Regular',
    description: 'Complete 5 study sessions',
    icon: '📋',
    check: (s) => s.sessionsCompleted >= 5,
  },
  {
    id: 'sessions-25',
    name: 'Devoted',
    description: 'Complete 25 study sessions',
    icon: '🎓',
    check: (s) => s.sessionsCompleted >= 25,
  },

  // ── Mastery badges ─────────────────────────────────────────────────────────
  {
    id: 'first-mastery',
    name: 'First Mastery',
    description: 'Master your first question',
    icon: '🥇',
    check: (s) => {
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.masteryLevel >= 3) return true;
      }
      return false;
    },
  },
  {
    id: 'mastery-10',
    name: 'Knowledge Builder',
    description: 'Master 10 questions',
    icon: '🧠',
    check: (s) => {
      let count = 0;
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.masteryLevel >= 3) count++;
      }
      return count >= 10;
    },
  },
  {
    id: 'mastery-50',
    name: 'Subject Expert',
    description: 'Master 50 questions',
    icon: '🎖️',
    check: (s) => {
      let count = 0;
      for (const qp of Object.values(s.questionProgress)) {
        if (qp.masteryLevel >= 3) count++;
      }
      return count >= 50;
    },
  },

  // ── Domain-complete badges (8 domains) ─────────────────────────────────────
  ...ALL_DOMAIN_IDS.map((domainId) => ({
    id: `domain-${domainId}`,
    name: `${DOMAIN_NAMES[domainId]} Complete`,
    description: `Attempt every question in ${DOMAIN_NAMES[domainId]}`,
    icon: '📖',
    check: (s: BadgeCheckState) => {
      const stats = domainAttempted(domainId, s.questionProgress);
      return stats.total > 0 && stats.attempted >= stats.total;
    },
  })),

  // ── Deep Dive badges ───────────────────────────────────────────────────────
  {
    id: 'deep-dive-1',
    name: 'Deep Diver',
    description: 'Complete your first Deep Dive',
    icon: '🤿',
    check: (s) => s.deepDivesCompleted >= 1,
  },
  {
    id: 'deep-dive-10',
    name: 'Ocean Explorer',
    description: 'Complete 10 Deep Dives',
    icon: '🐋',
    check: (s) => s.deepDivesCompleted >= 10,
  },
  {
    id: 'deep-dive-25',
    name: 'Abyss Walker',
    description: 'Complete 25 Deep Dives',
    icon: '🌊',
    check: (s) => s.deepDivesCompleted >= 25,
  },

  // ── Boss fight badges ──────────────────────────────────────────────────────
  {
    id: 'first-boss',
    name: 'Boss Slayer',
    description: 'Defeat your first Boss Fight',
    icon: '⚔️',
    check: (s) => s.bossesDefeated.length >= 1,
  },
  {
    id: 'all-bosses',
    name: 'SAT Champion',
    description: 'Defeat all 8 domain Boss Fights',
    icon: '🏰',
    check: (s) => s.bossesDefeated.length >= 8,
  },

  // ── Calibration badge ──────────────────────────────────────────────────────
  {
    id: 'well-calibrated',
    name: 'Well Calibrated',
    description: 'Achieve 70%+ calibration accuracy over 20+ ratings',
    icon: '🎯',
    check: (s) => {
      // Check from questionProgress confidence ratings
      let wellCalibrated = 0;
      let total = 0;
      for (const qp of Object.values(s.questionProgress)) {
        for (const a of qp.attempts) {
          if (a.confidenceRating !== undefined) {
            total++;
            const confident = a.confidenceRating >= 4;
            if ((confident && a.correct) || (!confident && !a.correct)) {
              wellCalibrated++;
            }
          }
        }
      }
      return total >= 20 && wellCalibrated / total >= 0.7;
    },
  },

  // ── Grid-in badge ──────────────────────────────────────────────────────────
  {
    id: 'grid-in-25',
    name: 'Grid Master',
    description: 'Answer 25 grid-in questions',
    icon: '🔢',
    check: (s) => {
      const gridInIds = new Set(
        getQuestionsByType('grid-in').map((q) => q.id),
      );
      let count = 0;
      for (const [qid, qp] of Object.entries(s.questionProgress)) {
        if (gridInIds.has(qid) && qp.attempts.length > 0) {
          count++;
        }
      }
      return count >= 25;
    },
  },

  // ── Mock test badges ───────────────────────────────────────────────────────
  {
    id: 'first-mock-test',
    name: 'Test Day Ready',
    description: 'Complete your first mock test',
    icon: '📄',
    check: (s) => s.mockTestHistory.length >= 1,
  },
  {
    id: 'score-1400',
    name: 'High Scorer',
    description: 'Achieve 1400+ on a mock test',
    icon: '🏅',
    check: (s) =>
      s.mockTestHistory.some((mt) => mt.score.total >= 1400),
  },

  // ── Strategy Guide badge ────────────────────────────────────────────────
  {
    id: 'strategy-scholar',
    name: 'Strategy Scholar',
    description: 'Complete the entire SAT Strategy Guide',
    icon: '📜',
    check: (s) => s.strategyGuideCompleted,
  },
];

// ─── Check for newly earned badges ───────────────────────────────────────────

export function checkNewBadges(
  state: BadgeCheckState,
  alreadyEarned: string[],
): string[] {
  const newBadges: string[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (alreadyEarned.includes(def.id)) continue;
    if (def.check(state)) {
      newBadges.push(def.id);
    }
  }

  return newBadges;
}

// ─── Get badge progress (for UI) ─────────────────────────────────────────────

export function getBadgeProgress(
  state: BadgeCheckState,
): Array<{ id: string; name: string; description: string; icon: string; earned: boolean }> {
  const earned = new Set(state.earnedBadges);
  return BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    earned: earned.has(def.id),
  }));
}
