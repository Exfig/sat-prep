import type { DomainId } from '../types';

export interface StrategyTip {
  id: string;
  domain: DomainId;
  skill: string;
  tip: string;
}

/**
 * Domain-indexed strategy tip database.
 *
 * Contains 2-3 tips per domain (8 domains = 20 tips total) covering key
 * test-taking strategies for both Reading & Writing and Math sections.
 */
export const STRATEGY_TIPS: StrategyTip[] = [
  // ── Reading & Writing: Craft & Structure ──────────────────────────
  {
    id: 'rw-cs-1',
    domain: 'rw-craft-and-structure',
    skill: 'Vocabulary in Context',
    tip: 'For vocabulary questions, always read the full sentence before looking at choices. The context often eliminates 2-3 wrong answers.',
  },
  {
    id: 'rw-cs-2',
    domain: 'rw-craft-and-structure',
    skill: 'Text Structure and Purpose',
    tip: 'When asked about the purpose of a passage, pay attention to signal words like "however," "moreover," and "consequently"—they reveal the author\'s rhetorical strategy.',
  },
  {
    id: 'rw-cs-3',
    domain: 'rw-craft-and-structure',
    skill: 'Cross-Text Connections',
    tip: 'For paired passage questions, read each passage individually and summarize its main point before comparing the two. This prevents you from conflating their arguments.',
  },

  // ── Reading & Writing: Information & Ideas ────────────────────────
  {
    id: 'rw-ii-1',
    domain: 'rw-information-and-ideas',
    skill: 'Central Ideas and Details',
    tip: 'For main idea questions, look at the first and last sentences of the passage—they often contain the central claim.',
  },
  {
    id: 'rw-ii-2',
    domain: 'rw-information-and-ideas',
    skill: 'Inferences',
    tip: 'When making inferences, the correct answer must be directly supported by evidence in the text. If you have to make an extra logical leap, it is probably wrong.',
  },
  {
    id: 'rw-ii-3',
    domain: 'rw-information-and-ideas',
    skill: 'Command of Evidence',
    tip: 'For "which choice best supports" questions, go back to the passage and verify each piece of evidence rather than relying on memory.',
  },

  // ── Reading & Writing: Standard English Conventions ───────────────
  {
    id: 'rw-sec-1',
    domain: 'rw-standard-english-conventions',
    skill: 'Punctuation',
    tip: 'If two answer choices differ only in punctuation, focus on whether the clauses are independent or dependent.',
  },
  {
    id: 'rw-sec-2',
    domain: 'rw-standard-english-conventions',
    skill: 'Subject-Verb Agreement',
    tip: 'When the subject and verb are far apart, cross out the prepositional phrases between them to find the true subject and check agreement.',
  },
  {
    id: 'rw-sec-3',
    domain: 'rw-standard-english-conventions',
    skill: 'Pronoun Clarity',
    tip: 'For pronoun questions, identify the antecedent first. If the pronoun could refer to more than one noun, the sentence needs to be revised.',
  },

  // ── Reading & Writing: Expression of Ideas ────────────────────────
  {
    id: 'rw-ei-1',
    domain: 'rw-expression-of-ideas',
    skill: 'Transitions',
    tip: 'For transition questions, cover the transition word and determine the logical relationship yourself before looking at the choices.',
  },
  {
    id: 'rw-ei-2',
    domain: 'rw-expression-of-ideas',
    skill: 'Rhetorical Synthesis',
    tip: 'When asked to combine or rewrite sentences, choose the option that maintains all essential information while being the most concise.',
  },

  // ── Math: Algebra ─────────────────────────────────────────────────
  {
    id: 'math-alg-1',
    domain: 'math-algebra',
    skill: 'Systems of Equations',
    tip: 'When solving systems, look for a variable that is easy to eliminate by adding or subtracting equations.',
  },
  {
    id: 'math-alg-2',
    domain: 'math-algebra',
    skill: 'Linear Equations',
    tip: 'If a word problem gives a linear relationship, define your variable clearly (e.g., "let x = number of hours") and translate one sentence at a time.',
  },
  {
    id: 'math-alg-3',
    domain: 'math-algebra',
    skill: 'Inequalities',
    tip: 'Remember to flip the inequality sign when you multiply or divide both sides by a negative number—this is one of the most common careless errors.',
  },

  // ── Math: Advanced Math ───────────────────────────────────────────
  {
    id: 'math-am-1',
    domain: 'math-advanced-math',
    skill: 'Quadratic Equations',
    tip: 'For quadratic equations, check if you can factor before using the quadratic formula—it is usually faster.',
  },
  {
    id: 'math-am-2',
    domain: 'math-advanced-math',
    skill: 'Polynomial Operations',
    tip: 'When dividing polynomials, use synthetic division if the divisor is linear (x - c). It is quicker and less error-prone than long division.',
  },

  // ── Math: Problem-Solving & Data Analysis ─────────────────────────
  {
    id: 'math-ps-1',
    domain: 'math-problem-solving-data-analysis',
    skill: 'Percent Problems',
    tip: 'For percent problems, use the multiplier method (e.g., 20% increase = multiply by 1.20).',
  },
  {
    id: 'math-ps-2',
    domain: 'math-problem-solving-data-analysis',
    skill: 'Ratios and Proportions',
    tip: 'Set up proportions as two fractions equal to each other and cross-multiply. Label units to make sure the numerators and denominators match.',
  },
  {
    id: 'math-ps-3',
    domain: 'math-problem-solving-data-analysis',
    skill: 'Interpreting Graphs',
    tip: 'Before answering any graph question, read the axis labels, units, and title. Many wrong answers come from misreading what the graph actually shows.',
  },

  // ── Math: Geometry & Trigonometry ─────────────────────────────────
  {
    id: 'math-gt-1',
    domain: 'math-geometry-and-trigonometry',
    skill: 'Reference Formulas',
    tip: 'Always check the reference sheet at the start of the math section—it has area, volume, and trig formulas.',
  },
  {
    id: 'math-gt-2',
    domain: 'math-geometry-and-trigonometry',
    skill: 'Right Triangles',
    tip: 'For right triangle problems, quickly check if the sides form a common Pythagorean triple (3-4-5, 5-12-13, 8-15-17) before computing.',
  },
  {
    id: 'math-gt-3',
    domain: 'math-geometry-and-trigonometry',
    skill: 'Circles',
    tip: 'Remember that the equation (x - h)^2 + (y - k)^2 = r^2 gives center (h, k) and radius r. Watch for signs—(x + 3) means h = -3, not 3.',
  },
];

/**
 * Returns a random strategy tip for the given domain, or `undefined` if none exist.
 */
export function getRandomTipForDomain(domainId: DomainId): StrategyTip | undefined {
  const domainTips = STRATEGY_TIPS.filter((t) => t.domain === domainId);
  if (domainTips.length === 0) return undefined;
  const index = Math.floor(Math.random() * domainTips.length);
  return domainTips[index];
}

/**
 * Returns the first strategy tip matching the given skill (case-insensitive partial match),
 * or `undefined` if no tip matches.
 */
export function getTipForSkill(skill: string): StrategyTip | undefined {
  const lowerSkill = skill.toLowerCase();
  return STRATEGY_TIPS.find((t) => t.skill.toLowerCase().includes(lowerSkill));
}
