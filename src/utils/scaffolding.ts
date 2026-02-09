import type { QuestionProgress, DomainId, Question } from '../types';
import { allQuestions } from '../data/questions';

/**
 * Determine if hints should be available for a question based on scaffolding rules.
 * Hints available when: efactor < 2.2 OR repetition < 3
 */
export function shouldShowHints(
  questionProgress: QuestionProgress | undefined,
  scaffoldingOverride?: boolean,
): boolean {
  if (scaffoldingOverride) return true;
  if (!questionProgress) return true; // New question, show hints
  const sm2 = questionProgress.sm2;
  if (!sm2) return true;
  return sm2.easeFactor < 2.2 || sm2.repetition < 3;
}

/**
 * Determine if formula should be shown automatically (vs. hidden behind button).
 * Show formula when domain accuracy < 50%. Hide (but allow toggle) when > 70%.
 */
export function getFormulaVisibility(
  domainId: DomainId,
  progress: Record<string, QuestionProgress>,
  scaffoldingOverride?: boolean,
): 'show' | 'toggle' | 'hidden' {
  if (scaffoldingOverride) return 'show';

  const domainQs = allQuestions.filter((q) => q.domain === domainId);
  const attempted = domainQs.filter((q) => progress[q.id]?.attempts.length > 0);

  if (attempted.length < 3) return 'show'; // Not enough data, show by default

  const totalCorrect = attempted.reduce((sum, q) => {
    const qp = progress[q.id];
    return sum + qp.attempts.filter((a) => a.correct).length;
  }, 0);
  const totalAttempts = attempted.reduce((sum, q) => {
    const qp = progress[q.id];
    return sum + qp.attempts.length;
  }, 0);

  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  if (accuracy < 0.5) return 'show';
  if (accuracy > 0.7) return 'toggle';
  return 'show';
}

/**
 * Determine if Deep Dive should use free-text (vs. multiple choice).
 * Switch to free-text after 5 correct Deep Dives in the domain.
 */
export function shouldUseFreeTextDeepDive(
  domainId: DomainId,
  progress: Record<string, QuestionProgress>,
): boolean {
  const domainQs = allQuestions.filter((q) => q.domain === domainId);
  let correctDeepDives = 0;

  for (const q of domainQs) {
    const qp = progress[q.id];
    if (!qp) continue;
    for (const a of qp.attempts) {
      if (a.deepDiveCompleted && a.deepDiveCorrect) {
        correctDeepDives++;
      }
    }
  }

  return correctDeepDives >= 5;
}

/**
 * Check if scaffolding is about to fade for a question (show transition nudge).
 */
export function isScaffoldingFading(
  _question: Question,
  questionProgress: QuestionProgress | undefined,
): boolean {
  if (!questionProgress) return false;
  const sm2 = questionProgress.sm2;
  if (!sm2) return false;

  // Scaffolding fades when EF approaches 2.2 and repetition approaches 3
  return sm2.easeFactor >= 2.0 && sm2.easeFactor < 2.2 && sm2.repetition >= 2;
}
