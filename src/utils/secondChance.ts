import type { Question, QuestionProgress } from '../types';
import { allQuestions, getQuestionById } from '../data/questions';

// ─── Shuffle helper ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Second Chance question selection ────────────────────────────────────────

/**
 * After a student answers a question incorrectly, select a "second chance"
 * follow-up question. Priority order:
 *   1. Same skill (different question)
 *   2. Same confusableGroup
 *   3. Same domain
 *
 * The returned question should be a different question from the original,
 * preferably one the student hasn't mastered yet.
 */
export function selectSecondChanceQuestion(
  originalQuestionId: string,
  progress: Record<string, QuestionProgress>,
): string | null {
  const original = getQuestionById(originalQuestionId);
  if (!original) return null;

  const exclude = new Set([originalQuestionId]);

  // Helper: prefer non-mastered, non-recently-correct questions
  function scoreCandidate(q: Question): number {
    const qp = progress[q.id];
    if (!qp || qp.attempts.length === 0) return 0; // Unattempted = good candidate
    if (qp.masteryLevel >= 3) return 10; // Mastered = worst candidate
    if (qp.attempts[qp.attempts.length - 1].correct) return 5; // Recently correct = moderate
    return 1; // Incorrect = good
  }

  function pickBest(candidates: Question[]): string | null {
    if (candidates.length === 0) return null;
    const scored = candidates
      .filter((q) => !exclude.has(q.id))
      .map((q) => ({ id: q.id, score: scoreCandidate(q) }))
      .sort((a, b) => a.score - b.score);
    return scored.length > 0 ? scored[0].id : null;
  }

  // Priority 1: Same skill
  const sameSkill = allQuestions.filter(
    (q) => q.skill === original.skill && q.id !== originalQuestionId,
  );
  const fromSkill = pickBest(sameSkill);
  if (fromSkill) return fromSkill;

  // Priority 2: Same confusableGroup
  if (original.confusableGroup) {
    const sameGroup = allQuestions.filter(
      (q) =>
        q.confusableGroup === original.confusableGroup &&
        q.id !== originalQuestionId,
    );
    const fromGroup = pickBest(sameGroup);
    if (fromGroup) return fromGroup;
  }

  // Priority 3: Same domain
  const sameDomain = allQuestions.filter(
    (q) => q.domain === original.domain && q.id !== originalQuestionId,
  );
  const fromDomain = pickBest(sameDomain);
  if (fromDomain) return fromDomain;

  // Fallback: random question from any domain at similar difficulty
  const fallback = allQuestions.filter(
    (q) => q.difficulty === original.difficulty && q.id !== originalQuestionId,
  );
  if (fallback.length > 0) {
    return shuffle(fallback)[0].id;
  }

  return null;
}

// ─── Check if second chance is available ─────────────────────────────────────

/**
 * Second chance is available when:
 * - The student answered incorrectly
 * - They haven't already used second chance on this attempt
 */
export function isSecondChanceAvailable(
  questionId: string,
  progress: Record<string, QuestionProgress>,
): boolean {
  const qp = progress[questionId];
  if (!qp || qp.attempts.length === 0) return false;

  const lastAttempt = qp.attempts[qp.attempts.length - 1];
  return !lastAttempt.correct && !lastAttempt.secondChanceQuestionId;
}
