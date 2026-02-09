import type { Question, SectionId, DomainId, Difficulty, QuestionType } from '../types';
import { rwCraftAndStructureQuestions } from './rw-craft-and-structure';
import { rwInformationAndIdeasQuestions } from './rw-information-and-ideas';
import { rwStandardEnglishConventionsQuestions } from './rw-standard-english-conventions';
import { rwExpressionOfIdeasQuestions } from './rw-expression-of-ideas';
import { mathAlgebraQuestions } from './math-algebra';
import { mathAdvancedMathQuestions } from './math-advanced-math';
import { mathProblemSolvingDataAnalysisQuestions } from './math-problem-solving-data-analysis';
import { mathGeometryAndTrigonometryQuestions } from './math-geometry-and-trigonometry';

export const allQuestions: Question[] = [
  ...rwCraftAndStructureQuestions,
  ...rwInformationAndIdeasQuestions,
  ...rwStandardEnglishConventionsQuestions,
  ...rwExpressionOfIdeasQuestions,
  ...mathAlgebraQuestions,
  ...mathAdvancedMathQuestions,
  ...mathProblemSolvingDataAnalysisQuestions,
  ...mathGeometryAndTrigonometryQuestions,
];

export function getQuestionsBySection(sectionId: SectionId): Question[] {
  return allQuestions.filter((q) => q.section === sectionId);
}

export function getQuestionsByDomain(domainId: DomainId): Question[] {
  return allQuestions.filter((q) => q.domain === domainId);
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return allQuestions.filter((q) => q.difficulty === difficulty);
}

export function getQuestionById(id: string): Question | undefined {
  return allQuestions.find((q) => q.id === id);
}

export function getQuestionsByType(type: QuestionType): Question[] {
  return allQuestions.filter((q) => q.type === type);
}
