import { describe, it, expect } from 'vitest';
import { getModule2Difficulty, selectByDifficulty } from './adaptiveMockTest';
import type { Question } from '../types';

// ─── Helper factory ──────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    section: 'math',
    domain: 'math-algebra',
    skill: 'Test Skill',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'Test question?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: 'Test explanation.',
    relatedConcepts: ['Test'],
    ...overrides,
  };
}

// ─── getModule2Difficulty ────────────────────────────────────────────────────

describe('getModule2Difficulty', () => {
  it('returns "harder" when score >= 70', () => {
    expect(getModule2Difficulty(70)).toBe('harder');
    expect(getModule2Difficulty(85)).toBe('harder');
    expect(getModule2Difficulty(100)).toBe('harder');
  });

  it('returns "easier" when score < 70', () => {
    expect(getModule2Difficulty(69)).toBe('easier');
    expect(getModule2Difficulty(50)).toBe('easier');
    expect(getModule2Difficulty(0)).toBe('easier');
  });

  it('handles exact boundary (70 = harder)', () => {
    expect(getModule2Difficulty(70)).toBe('harder');
  });

  it('handles just below boundary (69 = easier)', () => {
    expect(getModule2Difficulty(69)).toBe('easier');
  });

  it('handles 69.9 as easier (float just below 70)', () => {
    expect(getModule2Difficulty(69.9)).toBe('easier');
  });

  it('handles 70.0 as harder', () => {
    expect(getModule2Difficulty(70.0)).toBe('harder');
  });
});

// ─── selectByDifficulty ──────────────────────────────────────────────────────

describe('selectByDifficulty', () => {
  // Pool with enough questions per difficulty to avoid backfilling
  const questions: Question[] = [
    // 4 easy
    makeQuestion({ id: 'e1', difficulty: 'easy' }),
    makeQuestion({ id: 'e2', difficulty: 'easy' }),
    makeQuestion({ id: 'e3', difficulty: 'easy' }),
    makeQuestion({ id: 'e4', difficulty: 'easy' }),
    // 6 medium
    makeQuestion({ id: 'm1', difficulty: 'medium' }),
    makeQuestion({ id: 'm2', difficulty: 'medium' }),
    makeQuestion({ id: 'm3', difficulty: 'medium' }),
    makeQuestion({ id: 'm4', difficulty: 'medium' }),
    makeQuestion({ id: 'm5', difficulty: 'medium' }),
    makeQuestion({ id: 'm6', difficulty: 'medium' }),
    // 4 hard
    makeQuestion({ id: 'h1', difficulty: 'hard' }),
    makeQuestion({ id: 'h2', difficulty: 'hard' }),
    makeQuestion({ id: 'h3', difficulty: 'hard' }),
    makeQuestion({ id: 'h4', difficulty: 'hard' }),
  ];

  it('selects the correct total count', () => {
    const selected = selectByDifficulty(
      questions,
      { easy: 0.3, medium: 0.5, hard: 0.2 },
      10,
    );
    expect(selected.length).toBe(10);
  });

  it('respects difficulty distribution approximately', () => {
    const selected = selectByDifficulty(
      questions,
      { easy: 0.3, medium: 0.5, hard: 0.2 },
      10,
    );
    const easyCount = selected.filter((q) => q.difficulty === 'easy').length;
    const mediumCount = selected.filter((q) => q.difficulty === 'medium').length;
    const hardCount = selected.filter((q) => q.difficulty === 'hard').length;

    // easyCount = Math.round(10 * 0.3) = 3
    // hardCount = Math.round(10 * 0.2) = 2
    // mediumCount = 10 - 3 - 2 = 5
    expect(easyCount).toBe(3);
    expect(hardCount).toBe(2);
    expect(mediumCount).toBe(5);
  });

  it('backfills when a difficulty pool is too small', () => {
    const limitedQuestions: Question[] = [
      makeQuestion({ id: 'e1', difficulty: 'easy' }),
      makeQuestion({ id: 'm1', difficulty: 'medium' }),
      makeQuestion({ id: 'm2', difficulty: 'medium' }),
      makeQuestion({ id: 'm3', difficulty: 'medium' }),
      makeQuestion({ id: 'h1', difficulty: 'hard' }),
    ];
    // Requesting 5 questions with 30% easy = 2, but only 1 easy available
    const selected = selectByDifficulty(
      limitedQuestions,
      { easy: 0.3, medium: 0.5, hard: 0.2 },
      5,
    );
    // Should still get 5 total by backfilling
    expect(selected.length).toBe(5);
  });

  it('returns fewer questions if pool is too small', () => {
    const tinyPool: Question[] = [
      makeQuestion({ id: 'e1', difficulty: 'easy' }),
      makeQuestion({ id: 'm1', difficulty: 'medium' }),
    ];
    const selected = selectByDifficulty(
      tinyPool,
      { easy: 0.3, medium: 0.5, hard: 0.2 },
      10,
    );
    // Only 2 questions available
    expect(selected.length).toBe(2);
  });

  it('returns empty array for empty pool', () => {
    const selected = selectByDifficulty(
      [],
      { easy: 0.3, medium: 0.5, hard: 0.2 },
      10,
    );
    expect(selected).toEqual([]);
  });

  it('handles harder distribution (Module 2 harder)', () => {
    const selected = selectByDifficulty(
      questions,
      { easy: 0.1, medium: 0.5, hard: 0.4 },
      10,
    );
    const hardCount = selected.filter((q) => q.difficulty === 'hard').length;
    // 40% of 10 = 4 hard, but only 3 available, so should backfill
    expect(hardCount).toBeGreaterThanOrEqual(3);
    expect(selected.length).toBe(10);
  });

  it('handles easier distribution (Module 2 easier)', () => {
    const selected = selectByDifficulty(
      questions,
      { easy: 0.5, medium: 0.4, hard: 0.1 },
      10,
    );
    const easyCount = selected.filter((q) => q.difficulty === 'easy').length;
    // 50% of 10 = 5 easy, but only 3 available
    expect(easyCount).toBeGreaterThanOrEqual(3);
    expect(selected.length).toBe(10);
  });
});
