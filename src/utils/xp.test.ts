import { describe, it, expect } from 'vitest';
import { LEVELS, calculateXPReward, getLevelForXP, getXPToNextLevel } from './xp';

// ─── LEVELS constant ────────────────────────────────────────────────────────

describe('LEVELS', () => {
  it('has 10 levels', () => {
    expect(LEVELS).toHaveLength(10);
  });

  it('starts at level 1 with 0 XP required', () => {
    expect(LEVELS[0]).toEqual({ level: 1, title: 'Test Taker', xpRequired: 0 });
  });

  it('ends at level 10 with 5000 XP required', () => {
    expect(LEVELS[9]).toEqual({ level: 10, title: 'SAT Champion', xpRequired: 5000 });
  });

  it('has monotonically increasing XP thresholds', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it('has the correct XP thresholds', () => {
    const thresholds = LEVELS.map((l) => l.xpRequired);
    expect(thresholds).toEqual([0, 100, 250, 500, 800, 1200, 1800, 2800, 4000, 5000]);
  });
});

// ─── calculateXPReward ───────────────────────────────────────────────────────

describe('calculateXPReward', () => {
  describe('correct answers', () => {
    it('gives 10 base XP for correct easy answer (not first attempt)', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'easy', isFirstAttempt: false });
      // base = 10, multiplier = 1 (easy), no first attempt bonus
      expect(xp).toBe(10);
    });

    it('gives 15 base XP for correct medium answer (not first attempt)', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'medium', isFirstAttempt: false });
      // base = 10 * 1.5 = 15
      expect(xp).toBe(15);
    });

    it('gives 20 base XP for correct hard answer (not first attempt)', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'hard', isFirstAttempt: false });
      // base = 10 * 2 = 20
      expect(xp).toBe(20);
    });
  });

  describe('incorrect answers', () => {
    it('gives 2 base XP for incorrect easy answer', () => {
      const xp = calculateXPReward({ correct: false, difficulty: 'easy', isFirstAttempt: false });
      // base = 2, multiplier = 1
      expect(xp).toBe(2);
    });

    it('gives 3 base XP for incorrect medium answer', () => {
      const xp = calculateXPReward({ correct: false, difficulty: 'medium', isFirstAttempt: false });
      // base = 2 * 1.5 = 3
      expect(xp).toBe(3);
    });

    it('gives 4 base XP for incorrect hard answer', () => {
      const xp = calculateXPReward({ correct: false, difficulty: 'hard', isFirstAttempt: false });
      // base = 2 * 2 = 4
      expect(xp).toBe(4);
    });
  });

  describe('first attempt bonus', () => {
    it('adds 5 XP for correct first attempt', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'easy', isFirstAttempt: true });
      // base = 10 * 1 + 5 = 15
      expect(xp).toBe(15);
    });

    it('does NOT add first attempt bonus for incorrect answer', () => {
      const xp = calculateXPReward({ correct: false, difficulty: 'easy', isFirstAttempt: true });
      // base = 2 * 1 = 2, no first attempt bonus because not correct
      expect(xp).toBe(2);
    });

    it('stacks with difficulty multiplier', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'hard', isFirstAttempt: true });
      // base = 10 * 2 + 5 = 25
      expect(xp).toBe(25);
    });
  });

  describe('overdue bonus', () => {
    it('adds 3 XP for overdue questions', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'easy', isFirstAttempt: false, isOverdue: true });
      // base = 10 * 1 + 3 = 13
      expect(xp).toBe(13);
    });

    it('stacks with first attempt bonus', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'easy', isFirstAttempt: true, isOverdue: true });
      // base = 10 * 1 + 5 + 3 = 18
      expect(xp).toBe(18);
    });

    it('applies to incorrect answers too', () => {
      const xp = calculateXPReward({ correct: false, difficulty: 'easy', isFirstAttempt: false, isOverdue: true });
      // base = 2 * 1 + 3 = 5
      expect(xp).toBe(5);
    });
  });

  describe('maximum XP scenarios', () => {
    it('gives max XP for correct hard first-attempt overdue', () => {
      const xp = calculateXPReward({ correct: true, difficulty: 'hard', isFirstAttempt: true, isOverdue: true });
      // base = 10 * 2 + 5 + 3 = 28
      expect(xp).toBe(28);
    });
  });

  describe('rounding', () => {
    it('rounds results to nearest integer', () => {
      // Medium incorrect: 2 * 1.5 = 3.0 (already integer)
      const xp = calculateXPReward({ correct: false, difficulty: 'medium', isFirstAttempt: false });
      expect(Number.isInteger(xp)).toBe(true);
    });
  });
});

// ─── getLevelForXP ───────────────────────────────────────────────────────────

describe('getLevelForXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelForXP(0).level).toBe(1);
    expect(getLevelForXP(0).title).toBe('Test Taker');
  });

  it('returns level 1 for 99 XP', () => {
    expect(getLevelForXP(99).level).toBe(1);
  });

  it('returns level 2 for exactly 100 XP', () => {
    expect(getLevelForXP(100).level).toBe(2);
    expect(getLevelForXP(100).title).toBe('Study Starter');
  });

  it('returns level 2 for 249 XP', () => {
    expect(getLevelForXP(249).level).toBe(2);
  });

  it('returns level 3 for exactly 250 XP', () => {
    expect(getLevelForXP(250).level).toBe(3);
    expect(getLevelForXP(250).title).toBe('Score Builder');
  });

  it('returns level 10 for exactly 5000 XP', () => {
    expect(getLevelForXP(5000).level).toBe(10);
    expect(getLevelForXP(5000).title).toBe('SAT Champion');
  });

  it('returns level 10 for XP above max (e.g., 10000)', () => {
    expect(getLevelForXP(10000).level).toBe(10);
  });

  it('returns level 1 for negative XP', () => {
    expect(getLevelForXP(-5).level).toBe(1);
  });

  describe('all level boundaries', () => {
    const boundaries = [
      { xp: 0, level: 1 },
      { xp: 100, level: 2 },
      { xp: 250, level: 3 },
      { xp: 500, level: 4 },
      { xp: 800, level: 5 },
      { xp: 1200, level: 6 },
      { xp: 1800, level: 7 },
      { xp: 2800, level: 8 },
      { xp: 4000, level: 9 },
      { xp: 5000, level: 10 },
    ];

    for (const { xp, level } of boundaries) {
      it(`returns level ${level} at exactly ${xp} XP`, () => {
        expect(getLevelForXP(xp).level).toBe(level);
      });
    }

    // Test just below each boundary
    const justBelow = [
      { xp: 99, level: 1 },
      { xp: 249, level: 2 },
      { xp: 499, level: 3 },
      { xp: 799, level: 4 },
      { xp: 1199, level: 5 },
      { xp: 1799, level: 6 },
      { xp: 2799, level: 7 },
      { xp: 3999, level: 8 },
      { xp: 4999, level: 9 },
    ];

    for (const { xp, level } of justBelow) {
      it(`returns level ${level} at ${xp} XP (just below next threshold)`, () => {
        expect(getLevelForXP(xp).level).toBe(level);
      });
    }
  });
});

// ─── getXPToNextLevel ────────────────────────────────────────────────────────

describe('getXPToNextLevel', () => {
  it('returns progress within first level', () => {
    const result = getXPToNextLevel(50);
    expect(result.current).toBe(50); // 50 - 0
    expect(result.needed).toBe(100); // 100 - 0
    expect(result.progress).toBeCloseTo(0.5);
  });

  it('returns progress at start of a level', () => {
    const result = getXPToNextLevel(100);
    expect(result.current).toBe(0); // 100 - 100
    expect(result.needed).toBe(150); // 250 - 100
    expect(result.progress).toBeCloseTo(0);
  });

  it('returns full progress at max level', () => {
    const result = getXPToNextLevel(5000);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(0);
    expect(result.progress).toBe(1);
  });

  it('returns full progress for XP beyond max level', () => {
    const result = getXPToNextLevel(10000);
    expect(result.progress).toBe(1);
  });

  it('calculates correctly at level 5 midpoint', () => {
    // Level 5 = 800, Level 6 = 1200, midpoint = 1000
    const result = getXPToNextLevel(1000);
    expect(result.current).toBe(200); // 1000 - 800
    expect(result.needed).toBe(400); // 1200 - 800
    expect(result.progress).toBeCloseTo(0.5);
  });
});
