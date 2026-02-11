import type { DomainId, QuestionProgress } from '../types';
import { ALL_DOMAIN_IDS } from '../types';
import { getQuestionsByDomain } from '../data/questions';

// ─── Boss fight config ───────────────────────────────────────────────────────

export const BOSS_FIGHT_SIZE = 10;
export const BOSS_PASS_THRESHOLD = 0.8; // 80% to defeat boss

// ─── Determine which domain to boss-fight next ──────────────────────────────

/**
 * Returns the next domain eligible for a boss fight, or null if none are ready.
 * A domain is eligible when:
 * - The boss hasn't been defeated for that domain yet
 * - At least 60% of the domain's questions have been attempted
 * - Accuracy in the domain is >= 50%
 */
export function getBossDomain(
  progress: Record<string, QuestionProgress>,
  bossesDefeated: string[],
): DomainId | null {
  const defeated = new Set(bossesDefeated);

  for (const domainId of ALL_DOMAIN_IDS) {
    if (defeated.has(domainId)) continue;

    const domainQs = getQuestionsByDomain(domainId);
    if (domainQs.length === 0) continue;

    let attempted = 0;
    let correct = 0;
    let totalAttempts = 0;

    for (const q of domainQs) {
      const qp = progress[q.id];
      if (qp && qp.attempts.length > 0) {
        attempted++;
        totalAttempts += qp.attempts.length;
        correct += qp.attempts.filter((a) => a.correct).length;
      }
    }

    const attemptRate = attempted / domainQs.length;
    const accuracy = totalAttempts > 0 ? correct / totalAttempts : 0;

    if (attemptRate >= 0.6 && accuracy >= 0.5) {
      return domainId;
    }
  }

  return null;
}

// ─── Select boss fight questions ─────────────────────────────────────────────

/**
 * Selects questions for a boss fight in the target domain.
 * Skews toward medium/hard difficulty and prioritises questions
 * the student has gotten wrong or hasn't mastered.
 */
export function selectBossFightQuestions(
  targetDomain: DomainId,
  progress: Record<string, QuestionProgress>,
  count: number = BOSS_FIGHT_SIZE,
): string[] {
  const pool = getQuestionsByDomain(targetDomain);

  // Score each question — lower score = more likely to be selected
  const scored = pool.map((q) => {
    const qp = progress[q.id];
    let score = 0;

    // Difficulty weight: hard = 0, medium = 1, easy = 2
    if (q.difficulty === 'easy') score += 2;
    else if (q.difficulty === 'medium') score += 1;

    // Mastery penalty: mastered questions are less likely
    if (qp) {
      score += qp.masteryLevel;
      // Recently incorrect = more likely
      if (qp.attempts.length > 0 && !qp.attempts[qp.attempts.length - 1].correct) {
        score -= 2;
      }
    } else {
      // Never attempted — moderate priority
      score += 1;
    }

    return { question: q, score };
  });

  // Sort by score (lower = selected first) with randomness
  scored.sort((a, b) => a.score - b.score + (Math.random() - 0.5) * 2);

  return scored.slice(0, count).map((s) => s.question.id);
}

// ─── Check boss fight result ─────────────────────────────────────────────────

export function checkBossFightResult(
  questionIds: string[],
  progress: Record<string, QuestionProgress>,
  sessionStartedAt: number,
): { passed: boolean; score: number; correct: number; total: number } {
  let correct = 0;
  const total = questionIds.length;

  for (const id of questionIds) {
    const qp = progress[id];
    if (!qp) continue;
    // Only consider attempts from this session
    const sessionAttempts = qp.attempts.filter((a) => a.timestamp >= sessionStartedAt);
    if (sessionAttempts.length > 0 && sessionAttempts[sessionAttempts.length - 1].correct) {
      correct++;
    }
  }

  const score = total > 0 ? correct / total : 0;

  return {
    passed: score >= BOSS_PASS_THRESHOLD,
    score: Math.round(score * 100),
    correct,
    total,
  };
}

// ─── Get weak areas (domains with low accuracy) ─────────────────────────────

export function getWeakAreas(
  progress: Record<string, QuestionProgress>,
  threshold: number = 0.6,
): DomainId[] {
  const weakDomains: DomainId[] = [];

  for (const domainId of ALL_DOMAIN_IDS) {
    const domainQs = getQuestionsByDomain(domainId);
    let totalAttempts = 0;
    let totalCorrect = 0;

    for (const q of domainQs) {
      const qp = progress[q.id];
      if (qp && qp.attempts.length > 0) {
        totalAttempts += qp.attempts.length;
        totalCorrect += qp.attempts.filter((a) => a.correct).length;
      }
    }

    if (totalAttempts > 0) {
      const accuracy = totalCorrect / totalAttempts;
      if (accuracy < threshold) {
        weakDomains.push(domainId);
      }
    }
  }

  return weakDomains;
}
