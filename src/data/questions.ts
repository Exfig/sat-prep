import type { Question, SectionId, DomainId, Difficulty, QuestionType } from '../types';
import { rwCraftAndStructureQuestions } from './rw-craft-and-structure';
import { rwInformationAndIdeasQuestions } from './rw-information-and-ideas';
import { rwStandardEnglishConventionsQuestions } from './rw-standard-english-conventions';
import { rwExpressionOfIdeasQuestions } from './rw-expression-of-ideas';
import { mathAlgebraQuestions } from './math-algebra';
import { cbAlgebraQuestions } from './cb-algebra';
import { cbRwInformationAndIdeasQuestions } from './cb-rw-information-and-ideas';
import { cbRwCraftAndStructureQuestions } from './cb-rw-craft-and-structure';
import { cbRwExpressionOfIdeasQuestions } from './cb-rw-expression-of-ideas';
import { cbRwStandardEnglishConventionsQuestions } from './cb-rw-standard-english-conventions';
import { mathAdvancedMathQuestions } from './math-advanced-math';
import { mathProblemSolvingDataAnalysisQuestions } from './math-problem-solving-data-analysis';
import { mathGeometryAndTrigonometryQuestions } from './math-geometry-and-trigonometry';
import { cbMathAlgebraQuestions } from './cb-math-algebra';
import { cbMathAdvancedMathQuestions } from './cb-math-advanced-math';
import { cbMathProblemSolvingQuestions } from './cb-math-problem-solving';
import { cbMathGeometryQuestions } from './cb-math-geometry';

export const allQuestions: Question[] = [
  ...rwCraftAndStructureQuestions,
  ...rwInformationAndIdeasQuestions,
  ...rwStandardEnglishConventionsQuestions,
  ...rwExpressionOfIdeasQuestions,
  ...mathAlgebraQuestions,
  ...cbAlgebraQuestions,
  ...cbMathAlgebraQuestions,
  ...cbMathAdvancedMathQuestions,
  ...cbMathProblemSolvingQuestions,
  ...cbMathGeometryQuestions,
  ...cbRwInformationAndIdeasQuestions,
  ...cbRwCraftAndStructureQuestions,
  ...cbRwExpressionOfIdeasQuestions,
  ...cbRwStandardEnglishConventionsQuestions,
  ...mathAdvancedMathQuestions,
  ...mathProblemSolvingDataAnalysisQuestions,
  ...mathGeometryAndTrigonometryQuestions,
];

// ─── Pre-computed lookup maps (built once at module load) ────────────────────

const questionByIdMap = new Map<string, Question>(
  allQuestions.map((q) => [q.id, q]),
);

const questionsBySectionMap = new Map<SectionId, Question[]>();
const questionsByDomainMap = new Map<DomainId, Question[]>();
const questionsByDifficultyMap = new Map<Difficulty, Question[]>();
const questionsByTypeMap = new Map<QuestionType, Question[]>();

for (const q of allQuestions) {
  // By section
  let secList = questionsBySectionMap.get(q.section);
  if (!secList) { secList = []; questionsBySectionMap.set(q.section, secList); }
  secList.push(q);

  // By domain
  let domList = questionsByDomainMap.get(q.domain);
  if (!domList) { domList = []; questionsByDomainMap.set(q.domain, domList); }
  domList.push(q);

  // By difficulty
  let diffList = questionsByDifficultyMap.get(q.difficulty);
  if (!diffList) { diffList = []; questionsByDifficultyMap.set(q.difficulty, diffList); }
  diffList.push(q);

  // By type
  let typeList = questionsByTypeMap.get(q.type);
  if (!typeList) { typeList = []; questionsByTypeMap.set(q.type, typeList); }
  typeList.push(q);
}

// ─── Public accessors (O(1) lookups instead of O(n) scans) ──────────────────

export function getQuestionsBySection(sectionId: SectionId): Question[] {
  return questionsBySectionMap.get(sectionId) ?? [];
}

export function getQuestionsByDomain(domainId: DomainId): Question[] {
  return questionsByDomainMap.get(domainId) ?? [];
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return questionsByDifficultyMap.get(difficulty) ?? [];
}

export function getQuestionById(id: string): Question | undefined {
  return questionByIdMap.get(id);
}

export function getQuestionsByType(type: QuestionType): Question[] {
  return questionsByTypeMap.get(type) ?? [];
}
