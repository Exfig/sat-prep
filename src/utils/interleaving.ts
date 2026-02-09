import type { Question, DomainId, QuestionProgress } from '../types';
import { allQuestions } from '../data/questions';

// ─── Shuffle helper ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SAT confusable pairs ────────────────────────────────────────────────────

/**
 * 18 confusable skill pairs that students commonly mix up.
 * These are used to deliberately interleave questions from
 * confusable topics, strengthening discrimination learning.
 */
export const CONFUSABLE_PAIRS: [string, string][] = [
  // Math pairs
  ['linear-vs-exponential', 'exponential-growth-decay'],
  ['slope-intercept', 'point-slope'],
  ['completing-square', 'quadratic-formula'],
  ['similar-triangles', 'congruent-triangles'],
  ['permutations', 'combinations'],
  ['mean-median', 'standard-deviation'],
  ['absolute-value', 'distance-formula'],
  ['domain-range', 'function-notation'],
  ['arc-length', 'sector-area'],

  // RW / Grammar pairs
  ['semicolon-usage', 'colon-usage'],
  ['comma-splice', 'run-on-sentence'],
  ['subject-verb-agreement', 'pronoun-antecedent'],
  ['dangling-modifier', 'misplaced-modifier'],
  ['parallel-structure', 'faulty-comparison'],
  ['however-transition', 'therefore-transition'],
  ['main-idea', 'supporting-detail'],
  ['tone-purpose', 'rhetorical-strategy'],
  ['inference', 'explicit-evidence'],
];

// ─── Lookup: skill → its confusable partner(s) ──────────────────────────────

const confusableMap = new Map<string, string[]>();

for (const [a, b] of CONFUSABLE_PAIRS) {
  if (!confusableMap.has(a)) confusableMap.set(a, []);
  if (!confusableMap.has(b)) confusableMap.set(b, []);
  confusableMap.get(a)!.push(b);
  confusableMap.get(b)!.push(a);
}

export function getConfusableSkills(skill: string): string[] {
  return confusableMap.get(skill) ?? [];
}

// ─── Build hybrid queue with interleaving ────────────────────────────────────

/**
 * Builds a study queue that interleaves target-domain questions
 * with confusable questions from other domains/skills.
 *
 * Algorithm:
 * 1. Select primary questions from targetDomain
 * 2. For each primary question that has a confusable group or skill pair,
 *    insert a confusable question nearby
 * 3. Ensure no two questions from the same skill are adjacent
 *
 * @param targetDomain - The primary domain to study
 * @param progress - Student's question progress
 * @param count - Total number of questions to return
 * @returns Array of question IDs in interleaved order
 */
export function buildHybridQueue(
  targetDomain: DomainId,
  progress: Record<string, QuestionProgress>,
  count: number = 10,
): string[] {
  const primaryPool = allQuestions.filter((q) => q.domain === targetDomain);
  const otherPool = allQuestions.filter((q) => q.domain !== targetDomain);

  // Score primary questions: prefer unattempted & low-mastery
  const scoredPrimary = primaryPool.map((q) => {
    const qp = progress[q.id];
    let score = 0;
    if (!qp || qp.attempts.length === 0) score = 0;
    else if (qp.masteryLevel >= 3) score = 10;
    else score = qp.masteryLevel;
    return { question: q, score };
  });

  scoredPrimary.sort((a, b) => a.score - b.score + (Math.random() - 0.5));

  // Select about 70% primary, 30% confusable/interleaved
  const primaryCount = Math.ceil(count * 0.7);
  const interleavedCount = count - primaryCount;

  const selectedPrimary = scoredPrimary.slice(0, primaryCount).map((s) => s.question);
  const selectedIds = new Set(selectedPrimary.map((q) => q.id));

  // Find confusable questions
  const confusableQuestions: Question[] = [];

  for (const pq of selectedPrimary) {
    // Check by confusableGroup
    if (pq.confusableGroup) {
      const groupMatches = otherPool.filter(
        (q) => q.confusableGroup === pq.confusableGroup && !selectedIds.has(q.id),
      );
      if (groupMatches.length > 0) {
        const pick = groupMatches[Math.floor(Math.random() * groupMatches.length)];
        confusableQuestions.push(pick);
        selectedIds.add(pick.id);
        continue;
      }
    }

    // Check by skill pair
    const confusableSkills = getConfusableSkills(pq.skill);
    if (confusableSkills.length > 0) {
      const skillMatches = otherPool.filter(
        (q) => confusableSkills.includes(q.skill) && !selectedIds.has(q.id),
      );
      if (skillMatches.length > 0) {
        const pick = skillMatches[Math.floor(Math.random() * skillMatches.length)];
        confusableQuestions.push(pick);
        selectedIds.add(pick.id);
      }
    }
  }

  // Fill remaining interleaved slots with random other-domain questions
  const confusableSelected = confusableQuestions.slice(0, interleavedCount);
  if (confusableSelected.length < interleavedCount) {
    const remaining = shuffle(
      otherPool.filter((q) => !selectedIds.has(q.id)),
    );
    for (const q of remaining) {
      if (confusableSelected.length >= interleavedCount) break;
      confusableSelected.push(q);
      selectedIds.add(q.id);
    }
  }

  // Interleave: insert confusable questions between primary questions
  const result: Question[] = [];
  let confIdx = 0;

  for (let i = 0; i < selectedPrimary.length; i++) {
    result.push(selectedPrimary[i]);
    // Insert confusable after every 2-3 primary questions
    if ((i + 1) % 2 === 0 && confIdx < confusableSelected.length) {
      result.push(confusableSelected[confIdx]);
      confIdx++;
    }
  }

  // Append any remaining confusable questions
  while (confIdx < confusableSelected.length) {
    result.push(confusableSelected[confIdx]);
    confIdx++;
  }

  // Ensure no two adjacent questions share the same skill
  const final = dedupeAdjacentSkills(result);

  return final.slice(0, count).map((q) => q.id);
}

// ─── De-duplicate adjacent skills ────────────────────────────────────────────

function dedupeAdjacentSkills(questions: Question[]): Question[] {
  if (questions.length <= 1) return questions;

  const result = [questions[0]];
  const remaining = questions.slice(1);

  for (let i = 0; i < remaining.length; i++) {
    const prev = result[result.length - 1];
    if (remaining[i].skill !== prev.skill) {
      result.push(remaining[i]);
    } else {
      // Try to find a non-adjacent swap
      let swapped = false;
      for (let j = i + 1; j < remaining.length; j++) {
        if (remaining[j].skill !== prev.skill) {
          // Swap
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          result.push(remaining[i]);
          swapped = true;
          break;
        }
      }
      if (!swapped) {
        // No swap possible, just push anyway
        result.push(remaining[i]);
      }
    }
  }

  return result;
}

// ─── Check if a question is from a confusable pair ──────────────────────────

export function isConfusablePairQuestion(question: Question): boolean {
  return confusableMap.has(question.skill) || !!question.confusableGroup;
}

// ─── Get the confusable pair info for display ────────────────────────────────

export function getConfusablePairInfo(
  skill: string,
): { partner: string; pairIndex: number } | null {
  for (let i = 0; i < CONFUSABLE_PAIRS.length; i++) {
    const [a, b] = CONFUSABLE_PAIRS[i];
    if (skill === a) return { partner: b, pairIndex: i };
    if (skill === b) return { partner: a, pairIndex: i };
  }
  return null;
}
