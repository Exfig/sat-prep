import type { Question, SectionId, ModuleResult } from '../types';
import { getQuestionsBySection } from '../data/questions';
import { SECTION_DOMAINS } from '../types';

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects questions from `questions` matching a target difficulty distribution.
 *
 * @param questions   Pool of available questions.
 * @param distribution  Desired proportion for each difficulty (must sum to ~1).
 * @param count       Total number of questions to select.
 * @returns Selected questions (may be fewer than `count` if the pool is too small).
 */
export function selectByDifficulty(
  questions: Question[],
  distribution: { easy: number; medium: number; hard: number },
  count: number,
): Question[] {
  const easyCount = Math.round(count * distribution.easy);
  const hardCount = Math.round(count * distribution.hard);
  // Medium gets the remainder so rounding errors don't drop a question.
  const mediumCount = count - easyCount - hardCount;

  const easyPool = shuffle(questions.filter((q) => q.difficulty === 'easy'));
  const mediumPool = shuffle(questions.filter((q) => q.difficulty === 'medium'));
  const hardPool = shuffle(questions.filter((q) => q.difficulty === 'hard'));

  const selected: Question[] = [
    ...easyPool.slice(0, easyCount),
    ...mediumPool.slice(0, mediumCount),
    ...hardPool.slice(0, hardCount),
  ];

  // If any bucket was too small, backfill from the combined remaining pool.
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((q) => q.id));
    const remaining = shuffle(questions.filter((q) => !selectedIds.has(q.id)));
    const deficit = count - selected.length;
    selected.push(...remaining.slice(0, deficit));
  }

  return selected;
}

/**
 * Determines the default question count for a section module.
 * RW modules have 27 questions; Math modules have 22.
 */
function defaultModuleCount(section: SectionId): number {
  return section === 'reading-writing' ? 27 : 22;
}

/**
 * Selects questions for Module 1 (the non-adaptive module).
 *
 * - Difficulty distribution: 30% easy, 50% medium, 20% hard
 * - Balanced across all 4 domains in the section
 * - Result is shuffled
 *
 * @param section  The section (reading-writing or math).
 * @param count    Number of questions to select (defaults to 27 RW / 22 Math).
 * @returns Array of question IDs.
 */
export function selectModule1Questions(section: SectionId, count?: number): string[] {
  const total = count ?? defaultModuleCount(section);
  const domains = SECTION_DOMAINS[section];
  const perDomain = Math.floor(total / domains.length);
  const remainder = total - perDomain * domains.length;

  const distribution = { easy: 0.3, medium: 0.5, hard: 0.2 };
  const sectionQuestions = getQuestionsBySection(section);

  let selected: Question[] = [];

  for (let i = 0; i < domains.length; i++) {
    const domainId = domains[i];
    const domainPool = sectionQuestions.filter((q) => q.domain === domainId);
    // Give the first `remainder` domains an extra question so the total is exact.
    const domainCount = perDomain + (i < remainder ? 1 : 0);
    const picked = selectByDifficulty(domainPool, distribution, domainCount);
    selected.push(...picked);
  }

  return shuffle(selected).map((q) => q.id);
}

/**
 * Determines whether Module 2 should be the "harder" or "easier" pool
 * based on the Module 1 score.
 *
 * Threshold: >= 70% correct -> 'harder', < 70% -> 'easier'.
 */
export function getModule2Difficulty(module1Score: number): 'harder' | 'easier' {
  return module1Score >= 70 ? 'harder' : 'easier';
}

/**
 * Selects questions for Module 2 (the adaptive module).
 *
 * The difficulty distribution adapts based on Module 1 performance:
 * - "harder" pool (score >= 70%): 10% easy, 50% medium, 40% hard
 * - "easier" pool (score < 70%):  50% easy, 40% medium, 10% hard
 *
 * Questions already used in Module 1 are excluded.
 *
 * @param section        The section (reading-writing or math).
 * @param module1Result  The result from Module 1 for this section.
 * @param count          Number of questions (defaults to same as Module 1).
 * @returns Array of question IDs.
 */
export function selectModule2Questions(
  section: SectionId,
  module1Result: ModuleResult,
  count?: number,
): string[] {
  const total = count ?? defaultModuleCount(section);
  const difficulty = getModule2Difficulty(module1Result.score);

  const distribution =
    difficulty === 'harder'
      ? { easy: 0.1, medium: 0.5, hard: 0.4 }
      : { easy: 0.5, medium: 0.4, hard: 0.1 };

  // Exclude questions already used in Module 1.
  const usedIds = new Set(module1Result.questionIds);
  const sectionQuestions = getQuestionsBySection(section).filter((q) => !usedIds.has(q.id));

  const domains = SECTION_DOMAINS[section];
  const perDomain = Math.floor(total / domains.length);
  const remainder = total - perDomain * domains.length;

  let selected: Question[] = [];

  for (let i = 0; i < domains.length; i++) {
    const domainId = domains[i];
    const domainPool = sectionQuestions.filter((q) => q.domain === domainId);
    const domainCount = perDomain + (i < remainder ? 1 : 0);
    const picked = selectByDifficulty(domainPool, distribution, domainCount);
    selected.push(...picked);
  }

  return shuffle(selected).map((q) => q.id);
}
