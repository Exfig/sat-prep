import { describe, it, expect } from 'vitest';
import { selectPracticeQuestions } from './questionSelector';
import { allQuestions } from '../data/questions';

// ─── selectPracticeQuestions ─────────────────────────────────────────────────

describe('selectPracticeQuestions', () => {
  describe('filtering by section', () => {
    it('returns only reading-writing questions when section filter is set', () => {
      const ids = selectPracticeQuestions({ section: 'reading-writing', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.section).toBe('reading-writing');
      }
    });

    it('returns only math questions when section filter is set', () => {
      const ids = selectPracticeQuestions({ section: 'math', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.section).toBe('math');
      }
    });
  });

  describe('filtering by domain', () => {
    it('returns only questions from the specified domain', () => {
      const ids = selectPracticeQuestions({ domain: 'math-algebra', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.domain).toBe('math-algebra');
      }
    });

    it('returns only questions from rw-craft-and-structure', () => {
      const ids = selectPracticeQuestions({ domain: 'rw-craft-and-structure', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.domain).toBe('rw-craft-and-structure');
      }
    });
  });

  describe('filtering by difficulty', () => {
    it('returns only easy questions when difficulty filter is set', () => {
      const ids = selectPracticeQuestions({ difficulty: 'easy', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.difficulty).toBe('easy');
      }
    });

    it('returns only hard questions when difficulty filter is set', () => {
      const ids = selectPracticeQuestions({ difficulty: 'hard', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.difficulty).toBe('hard');
      }
    });
  });

  describe('combined filters', () => {
    it('filters by section AND difficulty', () => {
      const ids = selectPracticeQuestions({ section: 'math', difficulty: 'hard', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.section).toBe('math');
        expect(q!.difficulty).toBe('hard');
      }
    });

    it('filters by domain AND difficulty', () => {
      const ids = selectPracticeQuestions({ domain: 'math-algebra', difficulty: 'easy', count: 100 });
      const questions = ids.map((id) => allQuestions.find((q) => q.id === id));
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toBeDefined();
        expect(q!.domain).toBe('math-algebra');
        expect(q!.difficulty).toBe('easy');
      }
    });
  });

  describe('count limiting', () => {
    it('returns at most the requested count', () => {
      const ids = selectPracticeQuestions({ count: 5 });
      expect(ids.length).toBeLessThanOrEqual(5);
    });

    it('defaults to 10 questions when count is not specified', () => {
      const ids = selectPracticeQuestions({});
      expect(ids.length).toBeLessThanOrEqual(10);
    });
  });

  describe('excludeIds', () => {
    it('excludes specified question IDs', () => {
      const firstBatch = selectPracticeQuestions({ domain: 'math-algebra', count: 3 });
      const secondBatch = selectPracticeQuestions({
        domain: 'math-algebra',
        count: 3,
        excludeIds: firstBatch,
      });
      // No overlap between batches
      for (const id of secondBatch) {
        expect(firstBatch).not.toContain(id);
      }
    });
  });

  describe('unattempted prioritization', () => {
    it('prioritizes unattempted questions when progress is provided', () => {
      // Mark some questions as attempted
      const mathQuestions = allQuestions.filter((q) => q.domain === 'math-algebra');
      if (mathQuestions.length < 2) return; // Skip if not enough questions

      const attemptedId = mathQuestions[0].id;
      const progress = {
        [attemptedId]: {
          questionId: attemptedId,
          attempts: [{ timestamp: Date.now(), correct: true, userAnswer: 'A' }],
          masteryLevel: 1,
          lastAttempted: Date.now(),
          sm2: { easeFactor: 2.5, interval: 1, repetition: 1, nextReviewDate: null },
        },
      };

      // With only 1 count, should prefer the unattempted ones
      const ids = selectPracticeQuestions({
        domain: 'math-algebra',
        count: 1,
        progress,
      });

      // The selected question should not be the attempted one (if there are other options)
      if (mathQuestions.length > 1) {
        expect(ids[0]).not.toBe(attemptedId);
      }
    });
  });

  describe('return type', () => {
    it('returns an array of string IDs', () => {
      const ids = selectPracticeQuestions({ count: 5 });
      expect(Array.isArray(ids)).toBe(true);
      for (const id of ids) {
        expect(typeof id).toBe('string');
      }
    });

    it('all returned IDs correspond to valid questions', () => {
      const ids = selectPracticeQuestions({ count: 10 });
      for (const id of ids) {
        const q = allQuestions.find((q) => q.id === id);
        expect(q).toBeDefined();
      }
    });
  });
});

// ─── Question data integrity ────────────────────────────────────────────────

describe('Question data integrity', () => {
  it('all questions have required fields', () => {
    for (const q of allQuestions) {
      expect(q.id).toBeTruthy();
      expect(q.section).toMatch(/^(reading-writing|math)$/);
      expect(q.domain).toBeTruthy();
      expect(q.skill).toBeTruthy();
      expect(q.difficulty).toMatch(/^(easy|medium|hard)$/);
      expect(q.type).toMatch(/^(multiple-choice|grid-in)$/);
      expect(q.question).toBeTruthy();
      expect(q.explanation).toBeTruthy();
      expect(Array.isArray(q.relatedConcepts)).toBe(true);
    }
  });

  it('multiple-choice questions have options and correctAnswer', () => {
    const mcQuestions = allQuestions.filter((q) => q.type === 'multiple-choice');
    for (const q of mcQuestions) {
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThanOrEqual(2);
      expect(q.correctAnswer).toBeDefined();
    }
  });

  it('grid-in questions have correctAnswer', () => {
    const gridInQuestions = allQuestions.filter((q) => q.type === 'grid-in');
    for (const q of gridInQuestions) {
      expect(q.correctAnswer).toBeDefined();
    }
  });

  it('all question IDs are unique', () => {
    const ids = allQuestions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('RW domain questions have section=reading-writing', () => {
    const rwDomains = ['rw-craft-and-structure', 'rw-information-and-ideas', 'rw-standard-english-conventions', 'rw-expression-of-ideas'];
    for (const q of allQuestions) {
      if (rwDomains.includes(q.domain)) {
        expect(q.section).toBe('reading-writing');
      }
    }
  });

  it('Math domain questions have section=math', () => {
    const mathDomains = ['math-algebra', 'math-advanced-math', 'math-problem-solving-data-analysis', 'math-geometry-and-trigonometry'];
    for (const q of allQuestions) {
      if (mathDomains.includes(q.domain)) {
        expect(q.section).toBe('math');
      }
    }
  });
});
