import type { DomainId, DomainStats, OverallStats, QuestionProgress } from '../types';
import { ALL_DOMAIN_IDS } from '../types';
import { allQuestions, getQuestionsByDomain } from '../data/questions';

// ─── Calculate stats for a single domain ─────────────────────────────────────

export function calculateDomainStats(
  domainId: DomainId,
  progress: Record<string, QuestionProgress>,
): DomainStats {
  const domainQs = getQuestionsByDomain(domainId);

  let attempted = 0;
  let correct = 0;
  let mastered = 0;
  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const q of domainQs) {
    const qp = progress[q.id];
    if (qp && qp.attempts.length > 0) {
      attempted++;
      totalAttempts += qp.attempts.length;
      const correctCount = qp.attempts.filter((a) => a.correct).length;
      totalCorrect += correctCount;

      // Count "correct" as last attempt correct
      if (qp.attempts[qp.attempts.length - 1].correct) {
        correct++;
      }

      if (qp.masteryLevel >= 3) {
        mastered++;
      }
    }
  }

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return {
    domainId,
    totalQuestions: domainQs.length,
    attempted,
    correct,
    accuracy,
    mastered,
  };
}

// ─── Calculate overall stats across all domains ──────────────────────────────

export function calculateOverallStats(
  progress: Record<string, QuestionProgress>,
  studyStreak: number,
  lastStudyDate: string | null,
): OverallStats {
  const domainStats = ALL_DOMAIN_IDS.map((domainId) =>
    calculateDomainStats(domainId, progress),
  );

  const totalQuestions = domainStats.reduce((sum, ds) => sum + ds.totalQuestions, 0);
  const totalAttempted = domainStats.reduce((sum, ds) => sum + ds.attempted, 0);
  const totalCorrect = domainStats.reduce((sum, ds) => sum + ds.correct, 0);
  const totalMastered = domainStats.reduce((sum, ds) => sum + ds.mastered, 0);

  // Calculate overall accuracy from raw attempt data (not averaged domain accuracy)
  let rawTotalAttempts = 0;
  let rawTotalCorrect = 0;
  for (const qp of Object.values(progress)) {
    if (qp.attempts.length > 0) {
      rawTotalAttempts += qp.attempts.length;
      rawTotalCorrect += qp.attempts.filter((a) => a.correct).length;
    }
  }
  const overallAccuracy = rawTotalAttempts > 0
    ? Math.round((rawTotalCorrect / rawTotalAttempts) * 100)
    : 0;

  return {
    totalQuestions,
    totalAttempted,
    totalCorrect,
    overallAccuracy,
    totalMastered,
    studyStreak,
    lastStudyDate,
    domainStats,
  };
}

// ─── Get weak areas (domains below threshold) ────────────────────────────────

export function getWeakAreas(
  progress: Record<string, QuestionProgress>,
  threshold: number = 60,
): DomainId[] {
  // Calculate all domain stats once upfront to avoid redundant recalculation
  const domainStatsMap = new Map<DomainId, DomainStats>();
  for (const domainId of ALL_DOMAIN_IDS) {
    domainStatsMap.set(domainId, calculateDomainStats(domainId, progress));
  }

  const weak: DomainId[] = [];

  for (const domainId of ALL_DOMAIN_IDS) {
    const stats = domainStatsMap.get(domainId)!;
    // Only consider domains with some attempts
    if (stats.attempted > 0 && stats.accuracy < threshold) {
      weak.push(domainId);
    }
  }

  // Sort by accuracy ascending (weakest first) — uses cached stats, no recalculation
  weak.sort((a, b) => {
    return domainStatsMap.get(a)!.accuracy - domainStatsMap.get(b)!.accuracy;
  });

  return weak;
}

// ─── Get recommended questions based on stats ────────────────────────────────

/**
 * Returns question IDs recommended for the student, prioritising:
 * 1. Questions from weak domains
 * 2. Unattempted questions
 * 3. Questions with low mastery
 */
export function getRecommendedQuestions(
  progress: Record<string, QuestionProgress>,
  count: number = 10,
): string[] {
  const weakDomains = getWeakAreas(progress);
  const recommendations: Array<{ id: string; priority: number }> = [];

  for (const q of allQuestions) {
    const qp = progress[q.id];
    let priority = 0;

    // Weak domain boost
    if (weakDomains.includes(q.domain)) {
      priority += 3;
    }

    // Unattempted boost
    if (!qp || qp.attempts.length === 0) {
      priority += 2;
    } else if (qp.masteryLevel < 2) {
      priority += 1;
    } else if (qp.masteryLevel >= 3) {
      priority -= 2; // Mastered = low priority
    }

    // Difficulty scaling: harder questions for students who need challenge
    if (q.difficulty === 'hard') priority += 0.5;

    recommendations.push({ id: q.id, priority });
  }

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations.slice(0, count).map((r) => r.id);
}

// ─── Domain completion percentage ────────────────────────────────────────────

export function getDomainCompletion(
  domainId: DomainId,
  progress: Record<string, QuestionProgress>,
): number {
  const stats = calculateDomainStats(domainId, progress);
  if (stats.totalQuestions === 0) return 0;
  return Math.round((stats.attempted / stats.totalQuestions) * 100);
}

// ─── Section stats aggregation ───────────────────────────────────────────────

export function getSectionAccuracy(
  sectionDomains: DomainId[],
  progress: Record<string, QuestionProgress>,
): number {
  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const domainId of sectionDomains) {
    const domainQs = getQuestionsByDomain(domainId);
    for (const q of domainQs) {
      const qp = progress[q.id];
      if (qp && qp.attempts.length > 0) {
        totalAttempts += qp.attempts.length;
        totalCorrect += qp.attempts.filter((a) => a.correct).length;
      }
    }
  }

  return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
}
