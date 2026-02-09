import type { SATScore, DomainStats, SectionId } from '../types';
import { getDomainSection } from '../types';
import type { ModuleResult } from '../types';

/** Minimum score for any single section. */
const SECTION_MIN = 200;
/** Maximum score for any single section. */
const SECTION_MAX = 800;
/** Score range above the minimum (800 - 200). */
const SECTION_RANGE = SECTION_MAX - SECTION_MIN;

/**
 * Clamps a value between `min` and `max` (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Maps a 0-1 accuracy to a 200-800 section score (linear interpolation).
 */
function accuracyToSectionScore(accuracy: number): number {
  const clamped = clamp(accuracy, 0, 1);
  return clamp(SECTION_MIN + Math.round(clamped * SECTION_RANGE), SECTION_MIN, SECTION_MAX);
}

/**
 * Computes weighted accuracy for a set of domain stats.
 *
 * Each domain's accuracy is weighted by the number of questions attempted in
 * that domain, so domains with more data have proportionally more influence.
 * If no questions have been attempted the accuracy is 0.
 */
function weightedAccuracy(stats: DomainStats[]): number {
  const totalAttempted = stats.reduce((sum, d) => sum + d.attempted, 0);
  if (totalAttempted === 0) return 0;
  const weightedSum = stats.reduce((sum, d) => sum + d.accuracy * d.attempted, 0);
  return weightedSum / totalAttempted;
}

/**
 * Estimates an SAT score from accumulated domain-level statistics.
 *
 * The approach:
 * 1. Separate the domain stats into Reading & Writing vs. Math.
 * 2. For each section, compute a weighted accuracy across its domains.
 * 3. Map that accuracy linearly to the 200-800 range.
 * 4. Sum for the composite (400-1600).
 *
 * @param domainStats  Array of per-domain statistics (may include both sections).
 * @returns Estimated SATScore with section and total scores.
 */
export function estimateScore(domainStats: DomainStats[]): SATScore {
  const rwStats = domainStats.filter((d) => getDomainSection(d.domainId) === 'reading-writing');
  const mathStats = domainStats.filter((d) => getDomainSection(d.domainId) === 'math');

  const rwAccuracy = weightedAccuracy(rwStats);
  const mathAccuracy = weightedAccuracy(mathStats);

  const readingWriting = accuracyToSectionScore(rwAccuracy);
  const math = accuracyToSectionScore(mathAccuracy);
  const total = clamp(readingWriting + math, 400, 1600);

  return { readingWriting, math, total };
}

/**
 * Estimates an SAT score from a full adaptive mock test (all module results).
 *
 * Module 2 difficulty affects the scaling:
 * - "harder" Module 2: accuracy multiplied by 1.1 (bonus, capped at 1.0)
 * - "easier" Module 2: accuracy multiplied by 0.9 (penalty)
 * - "standard" Module 2 (Module 1): no adjustment
 *
 * Per-section scoring:
 * 1. Average the raw accuracy of each module in the section.
 * 2. Apply the Module-2 difficulty adjustment.
 * 3. Map to 200-800.
 *
 * @param modules  Array of ModuleResult entries from the mock test (typically 4).
 * @returns Estimated SATScore.
 */
export function estimateScoreFromMockTest(modules: ModuleResult[]): SATScore {
  function sectionScore(section: SectionId): number {
    const sectionModules = modules.filter((m) => m.section === section);
    if (sectionModules.length === 0) return SECTION_MIN;

    // Calculate combined accuracy across all module questions in this section.
    const totalCorrect = sectionModules.reduce(
      (sum, m) => sum + m.answers.filter((a) => a.correct).length,
      0,
    );
    const totalQuestions = sectionModules.reduce((sum, m) => sum + m.answers.length, 0);
    if (totalQuestions === 0) return SECTION_MIN;

    let accuracy = totalCorrect / totalQuestions;

    // Apply Module 2 difficulty scaling.
    const module2 = sectionModules.find((m) => m.moduleNumber === 2);
    if (module2) {
      if (module2.difficulty === 'harder') {
        accuracy = Math.min(accuracy * 1.1, 1.0);
      } else if (module2.difficulty === 'easier') {
        accuracy = accuracy * 0.9;
      }
    }

    return accuracyToSectionScore(accuracy);
  }

  const readingWriting = sectionScore('reading-writing');
  const math = sectionScore('math');
  const total = clamp(readingWriting + math, 400, 1600);

  return { readingWriting, math, total };
}
