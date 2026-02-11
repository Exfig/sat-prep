import type { Question, DomainId, SectionId, QuestionProgress, Difficulty } from '../types';
import { allQuestions, getQuestionsByDomain } from '../data/questions';
import { getDueQuestions } from './sm2';

// ─── Shuffle helper ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Practice questions (domain + optional section/difficulty filter) ─────────

export function selectPracticeQuestions(options: {
  domain?: DomainId;
  section?: SectionId;
  difficulty?: Difficulty;
  count?: number;
  progress?: Record<string, QuestionProgress>;
  excludeIds?: string[];
}): string[] {
  const { domain, section, difficulty, count = 10, progress = {}, excludeIds = [] } = options;

  let pool = allQuestions.filter((q) => {
    if (domain && q.domain !== domain) return false;
    if (section && q.section !== section) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    if (excludeIds.includes(q.id)) return false;
    return true;
  });

  // Prioritise unattempted questions
  const unattempted = pool.filter((q) => !progress[q.id] || progress[q.id].attempts.length === 0);
  const attempted = pool.filter((q) => progress[q.id] && progress[q.id].attempts.length > 0);

  const selected = [
    ...shuffle(unattempted).slice(0, count),
    ...shuffle(attempted),
  ].slice(0, count);

  return selected.map((q) => q.id);
}

// ─── Timed module questions (SAT module = 27 questions) ─────────────────────

export function selectTimedModuleQuestions(options: {
  section: SectionId;
  difficulty?: Difficulty;
  progress?: Record<string, QuestionProgress>;
}): string[] {
  const { section, difficulty } = options;
  const MODULE_SIZE = 27;

  let pool = allQuestions.filter((q) => {
    if (q.section !== section) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });

  // Balance difficulty: ~30% easy, ~40% medium, ~30% hard if no explicit filter
  if (!difficulty) {
    const easy = shuffle(pool.filter((q) => q.difficulty === 'easy'));
    const medium = shuffle(pool.filter((q) => q.difficulty === 'medium'));
    const hard = shuffle(pool.filter((q) => q.difficulty === 'hard'));

    const easyCount = Math.round(MODULE_SIZE * 0.3);
    const hardCount = Math.round(MODULE_SIZE * 0.3);
    const mediumCount = MODULE_SIZE - easyCount - hardCount;

    const selected = [
      ...easy.slice(0, easyCount),
      ...medium.slice(0, mediumCount),
      ...hard.slice(0, hardCount),
    ];

    // If we don't have enough, pad from remaining pool
    if (selected.length < MODULE_SIZE) {
      const selectedIds = new Set(selected.map((q) => q.id));
      const remaining = shuffle(pool.filter((q) => !selectedIds.has(q.id)));
      selected.push(...remaining.slice(0, MODULE_SIZE - selected.length));
    }

    return shuffle(selected).slice(0, MODULE_SIZE).map((q) => q.id);
  }

  return shuffle(pool).slice(0, MODULE_SIZE).map((q) => q.id);
}

// ─── Domain review questions ─────────────────────────────────────────────────

export function selectDomainReviewQuestions(options: {
  domain: DomainId;
  count?: number;
  progress?: Record<string, QuestionProgress>;
}): string[] {
  const { domain, count = 10, progress = {} } = options;

  const pool = getQuestionsByDomain(domain);

  // Prioritise questions with low mastery or not yet attempted
  const scored = pool.map((q) => {
    const qp = progress[q.id];
    let priority = 0;
    if (!qp || qp.attempts.length === 0) {
      priority = 3; // Unattempted = highest
    } else if (qp.masteryLevel === 0) {
      priority = 2;
    } else if (qp.masteryLevel < 3) {
      priority = 1;
    } else {
      priority = 0; // Mastered = lowest
    }
    return { question: q, priority };
  });

  scored.sort((a, b) => b.priority - a.priority || Math.random() - 0.5);

  return scored.slice(0, count).map((s) => s.question.id);
}

// ─── Weak-area questions ─────────────────────────────────────────────────────

export function selectWeakAreaQuestions(options: {
  count?: number;
  progress: Record<string, QuestionProgress>;
}): string[] {
  const { count = 10, progress } = options;

  // Find questions with low accuracy or mastery
  const weak: Array<{ id: string; score: number }> = [];

  for (const q of allQuestions) {
    const qp = progress[q.id];
    if (!qp || qp.attempts.length === 0) continue;

    const totalAttempts = qp.attempts.length;
    const correctCount = qp.attempts.filter((a) => a.correct).length;
    const accuracy = correctCount / totalAttempts;

    // Low accuracy or low mastery = weak area
    if (accuracy < 0.6 || qp.masteryLevel < 2) {
      weak.push({ id: q.id, score: accuracy + qp.masteryLevel * 0.1 });
    }
  }

  // Sort by weakest first
  weak.sort((a, b) => a.score - b.score);

  return weak.slice(0, count).map((w) => w.id);
}

// ─── Mixed practice (across all domains) ─────────────────────────────────────

export function selectMixedPracticeQuestions(options: {
  count?: number;
  progress?: Record<string, QuestionProgress>;
}): string[] {
  const { count = 10, progress = {} } = options;

  // Pick from different domains for variety
  const byDomain = new Map<string, Question[]>();
  for (const q of allQuestions) {
    if (!byDomain.has(q.domain)) byDomain.set(q.domain, []);
    byDomain.get(q.domain)!.push(q);
  }

  const result: Question[] = [];
  const domains = [...byDomain.keys()];
  let idx = 0;

  // Round-robin across domains
  while (result.length < count && domains.length > 0) {
    const domain = domains[idx % domains.length];
    const domainPool = byDomain.get(domain)!;

    if (domainPool.length === 0) {
      domains.splice(idx % domains.length, 1);
      if (domains.length === 0) break;
      continue;
    }

    // Prefer unattempted
    const unattemptedIdx = domainPool.findIndex(
      (q) => !progress[q.id] || progress[q.id].attempts.length === 0,
    );
    const pickIdx = unattemptedIdx >= 0 ? unattemptedIdx : Math.floor(Math.random() * domainPool.length);
    result.push(domainPool.splice(pickIdx, 1)[0]);
    idx++;
  }

  return shuffle(result).map((q) => q.id);
}

// ─── Spaced review (SM2-based) ──────────────────────────────────────────────

export function selectSpacedReviewQuestions(options: {
  count?: number;
  progress: Record<string, QuestionProgress>;
}): string[] {
  const { count = 10, progress } = options;

  const dueIds = getDueQuestions(progress);

  if (dueIds.length >= count) {
    return shuffle(dueIds).slice(0, count);
  }

  // Pad with overdue or low-mastery questions
  const dueSet = new Set(dueIds);
  const extras: Array<{ id: string; score: number }> = [];

  for (const q of allQuestions) {
    if (dueSet.has(q.id)) continue;
    const qp = progress[q.id];
    if (!qp || qp.attempts.length === 0) continue;
    // Prioritise low mastery
    extras.push({ id: q.id, score: qp.masteryLevel });
  }

  extras.sort((a, b) => a.score - b.score);
  const padded = [...dueIds, ...extras.slice(0, count - dueIds.length).map((e) => e.id)];

  return padded.slice(0, count);
}
