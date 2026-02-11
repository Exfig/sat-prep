import { describe, it, expect } from 'vitest';
import { estimateScore, estimateScoreFromMockTest } from './scoreEstimator';
import type { DomainStats, ModuleResult, SectionId } from '../types';

// ─── Helper factories ────────────────────────────────────────────────────────

function makeDomainStats(overrides: Partial<DomainStats> & { domainId: DomainStats['domainId'] }): DomainStats {
  return {
    totalQuestions: 10,
    attempted: 10,
    correct: 5,
    accuracy: 50,
    mastered: 0,
    ...overrides,
  };
}

function makeModuleResult(overrides: Partial<ModuleResult> & { section: SectionId }): ModuleResult {
  return {
    moduleNumber: 1,
    questionIds: [],
    answers: [],
    score: 0,
    difficulty: 'standard',
    ...overrides,
  };
}

// ─── estimateScore (from domain stats) ───────────────────────────────────────

describe('estimateScore', () => {
  describe('boundary values', () => {
    it('returns 200 per section when accuracy is 0%', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 0, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 0, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(200);
      expect(score.math).toBe(200);
      expect(score.total).toBe(400);
    });

    it('returns 800 per section when accuracy is 100%', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 100, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 100, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(800);
      expect(score.math).toBe(800);
      expect(score.total).toBe(1600);
    });
  });

  describe('linear interpolation', () => {
    it('returns 500 per section for 50% accuracy', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 50, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 50, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(500);
      expect(score.math).toBe(500);
      expect(score.total).toBe(1000);
    });

    it('returns 350 per section for 25% accuracy', () => {
      // 200 + round(0.25 * 600) = 200 + 150 = 350
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 25, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 25, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(350);
      expect(score.math).toBe(350);
      expect(score.total).toBe(700);
    });

    it('returns 650 per section for 75% accuracy', () => {
      // 200 + round(0.75 * 600) = 200 + 450 = 650
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 75, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 75, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(650);
      expect(score.math).toBe(650);
      expect(score.total).toBe(1300);
    });
  });

  describe('mixed section scores', () => {
    it('handles different accuracies per section', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 100, attempted: 10 }),
        makeDomainStats({ domainId: 'math-algebra', accuracy: 0, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(800);
      expect(score.math).toBe(200);
      expect(score.total).toBe(1000);
    });
  });

  describe('weighted accuracy across domains', () => {
    it('weights by number of questions attempted', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 100, attempted: 90 }),
        makeDomainStats({ domainId: 'rw-information-and-ideas', accuracy: 0, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      // Weighted accuracy = (100/100 * 90 + 0/100 * 10) / 100 = 0.9
      // 200 + round(0.9 * 600) = 200 + 540 = 740
      expect(score.readingWriting).toBe(740);
    });

    it('ignores domains with zero attempts', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'rw-craft-and-structure', accuracy: 100, attempted: 10 }),
        makeDomainStats({ domainId: 'rw-information-and-ideas', accuracy: 0, attempted: 0 }),
      ];
      const score = estimateScore(stats);
      // Only the first domain counts since the second has 0 attempted
      expect(score.readingWriting).toBe(800);
    });
  });

  describe('no data', () => {
    it('returns minimum scores when no stats provided', () => {
      const score = estimateScore([]);
      expect(score.readingWriting).toBe(200);
      expect(score.math).toBe(200);
      expect(score.total).toBe(400);
    });

    it('returns minimum for a section with no matching stats', () => {
      const stats: DomainStats[] = [
        makeDomainStats({ domainId: 'math-algebra', accuracy: 100, attempted: 10 }),
      ];
      const score = estimateScore(stats);
      expect(score.readingWriting).toBe(200);
      expect(score.math).toBe(800);
      expect(score.total).toBe(1000);
    });
  });
});

// ─── estimateScoreFromMockTest ───────────────────────────────────────────────

describe('estimateScoreFromMockTest', () => {
  describe('basic scoring', () => {
    it('returns minimum when no modules provided', () => {
      const score = estimateScoreFromMockTest([]);
      expect(score.readingWriting).toBe(200);
      expect(score.math).toBe(200);
      expect(score.total).toBe(400);
    });

    it('scores 100% accuracy correctly', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'reading-writing',
          moduleNumber: 1,
          answers: [
            { questionId: 'q1', userAnswer: 'A', correct: true },
            { questionId: 'q2', userAnswer: 'B', correct: true },
          ],
        }),
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          answers: [
            { questionId: 'q3', userAnswer: '5', correct: true },
            { questionId: 'q4', userAnswer: '10', correct: true },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      expect(score.readingWriting).toBe(800);
      expect(score.math).toBe(800);
      expect(score.total).toBe(1600);
    });

    it('scores 0% accuracy correctly', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'reading-writing',
          moduleNumber: 1,
          answers: [
            { questionId: 'q1', userAnswer: 'A', correct: false },
            { questionId: 'q2', userAnswer: 'B', correct: false },
          ],
        }),
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          answers: [
            { questionId: 'q3', userAnswer: '5', correct: false },
            { questionId: 'q4', userAnswer: '10', correct: false },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      expect(score.readingWriting).toBe(200);
      expect(score.math).toBe(200);
      expect(score.total).toBe(400);
    });
  });

  describe('Module 2 difficulty scaling', () => {
    it('applies 1.1x bonus for harder Module 2', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          answers: [
            { questionId: 'q1', userAnswer: '5', correct: true },
            { questionId: 'q2', userAnswer: '10', correct: false },
          ],
        }),
        makeModuleResult({
          section: 'math',
          moduleNumber: 2,
          difficulty: 'harder',
          answers: [
            { questionId: 'q3', userAnswer: '5', correct: true },
            { questionId: 'q4', userAnswer: '10', correct: false },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      // Combined: 2 correct out of 4 = 0.5 accuracy
      // Apply harder bonus: min(0.5 * 1.1, 1.0) = 0.55
      // 200 + round(0.55 * 600) = 200 + 330 = 530
      expect(score.math).toBe(530);
    });

    it('applies 0.9x penalty for easier Module 2', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          answers: [
            { questionId: 'q1', userAnswer: '5', correct: true },
            { questionId: 'q2', userAnswer: '10', correct: false },
          ],
        }),
        makeModuleResult({
          section: 'math',
          moduleNumber: 2,
          difficulty: 'easier',
          answers: [
            { questionId: 'q3', userAnswer: '5', correct: true },
            { questionId: 'q4', userAnswer: '10', correct: false },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      // Combined: 2 correct out of 4 = 0.5 accuracy
      // Apply easier penalty: 0.5 * 0.9 = 0.45
      // 200 + round(0.45 * 600) = 200 + 270 = 470
      expect(score.math).toBe(470);
    });

    it('does not adjust for standard difficulty (Module 1 only)', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          difficulty: 'standard',
          answers: [
            { questionId: 'q1', userAnswer: '5', correct: true },
            { questionId: 'q2', userAnswer: '10', correct: false },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      // 1 out of 2 = 0.5 accuracy, no adjustment
      // 200 + round(0.5 * 600) = 200 + 300 = 500
      expect(score.math).toBe(500);
    });

    it('caps harder bonus at 1.0 accuracy', () => {
      const modules: ModuleResult[] = [
        makeModuleResult({
          section: 'math',
          moduleNumber: 1,
          answers: [
            { questionId: 'q1', userAnswer: '5', correct: true },
          ],
        }),
        makeModuleResult({
          section: 'math',
          moduleNumber: 2,
          difficulty: 'harder',
          answers: [
            { questionId: 'q2', userAnswer: '10', correct: true },
          ],
        }),
      ];
      const score = estimateScoreFromMockTest(modules);
      // 100% accuracy * 1.1 = 1.1, capped at 1.0
      // 200 + round(1.0 * 600) = 800
      expect(score.math).toBe(800);
    });
  });

  describe('total score clamping', () => {
    it('clamps total between 400 and 1600', () => {
      // With all 0% accuracy, total should be 400
      const score = estimateScoreFromMockTest([]);
      expect(score.total).toBe(400);
      expect(score.total).toBeGreaterThanOrEqual(400);
      expect(score.total).toBeLessThanOrEqual(1600);
    });
  });
});
