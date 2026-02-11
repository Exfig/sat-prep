import { describe, it, expect } from 'vitest';
import { evaluateGridIn, parseGridInValue } from './gridIn';

// ─── parseGridInValue ────────────────────────────────────────────────────────

describe('parseGridInValue', () => {
  it('parses simple integers', () => {
    expect(parseGridInValue('42')).toBe(42);
    expect(parseGridInValue('0')).toBe(0);
    expect(parseGridInValue('-7')).toBe(-7);
  });

  it('parses decimals', () => {
    expect(parseGridInValue('3.5')).toBe(3.5);
    expect(parseGridInValue('0.25')).toBe(0.25);
    expect(parseGridInValue('-1.5')).toBe(-1.5);
  });

  it('parses simple fractions', () => {
    expect(parseGridInValue('3/4')).toBe(0.75);
    expect(parseGridInValue('1/2')).toBe(0.5);
    expect(parseGridInValue('1/3')).toBeCloseTo(0.3333, 4);
  });

  it('parses negative fractions', () => {
    expect(parseGridInValue('-5/3')).toBeCloseTo(-1.6667, 4);
    expect(parseGridInValue('-1/4')).toBe(-0.25);
  });

  it('handles numeric inputs (not just strings)', () => {
    expect(parseGridInValue(42)).toBe(42);
    expect(parseGridInValue(3.5)).toBe(3.5);
    expect(parseGridInValue(0)).toBe(0);
  });

  it('returns 0 for empty string (Number("") === 0 in JS)', () => {
    // Note: Number('') returns 0, not NaN. This means empty string
    // is treated as 0, which is handled by evaluateGridIn's NaN check
    // on the full flow (evaluateGridIn checks isNaN after parsing).
    expect(parseGridInValue('')).toBe(0);
  });

  it('returns NaN for non-numeric strings', () => {
    expect(isNaN(parseGridInValue('abc'))).toBe(true);
    expect(isNaN(parseGridInValue('hello'))).toBe(true);
  });

  it('returns NaN for division by zero', () => {
    // 1/0 in JS gives Infinity, not NaN
    expect(parseGridInValue('1/0')).toBe(Infinity);
  });

  it('handles whitespace in strings', () => {
    expect(parseGridInValue(' 42 ')).toBe(42);
    expect(parseGridInValue(' 3/4 ')).toBe(0.75);
  });
});

// ─── evaluateGridIn ──────────────────────────────────────────────────────────

describe('evaluateGridIn', () => {
  describe('exact matches', () => {
    it('matches identical integers', () => {
      expect(evaluateGridIn('5', 5)).toBe(true);
      expect(evaluateGridIn('42', 42)).toBe(true);
      expect(evaluateGridIn(5, 5)).toBe(true);
    });

    it('matches identical decimals', () => {
      expect(evaluateGridIn('3.5', 3.5)).toBe(true);
      expect(evaluateGridIn('0.75', 0.75)).toBe(true);
    });

    it('matches identical string answers', () => {
      expect(evaluateGridIn('4', '4')).toBe(true);
    });

    it('matches zero', () => {
      expect(evaluateGridIn('0', 0)).toBe(true);
      expect(evaluateGridIn(0, 0)).toBe(true);
    });
  });

  describe('fraction parsing', () => {
    it('matches fraction to its decimal equivalent', () => {
      expect(evaluateGridIn('3/4', 0.75)).toBe(true);
      expect(evaluateGridIn('1/2', 0.5)).toBe(true);
      expect(evaluateGridIn('1/4', 0.25)).toBe(true);
    });

    it('matches fraction to fraction', () => {
      expect(evaluateGridIn('3/4', '3/4')).toBe(true);
      expect(evaluateGridIn('2/4', '1/2')).toBe(true); // equivalent fractions
    });

    it('matches negative fractions', () => {
      expect(evaluateGridIn('-5/3', -5 / 3)).toBe(true);
      expect(evaluateGridIn('-1/2', -0.5)).toBe(true);
    });

    it('matches fraction to integer', () => {
      expect(evaluateGridIn('6/3', 2)).toBe(true);
      expect(evaluateGridIn('10/5', 2)).toBe(true);
    });
  });

  describe('decimal tolerance (0.01)', () => {
    it('accepts answers within 0.01 tolerance', () => {
      expect(evaluateGridIn('3.005', 3.0)).toBe(true);
      expect(evaluateGridIn('3.009', 3.0)).toBe(true);
    });

    it('rejects answers outside 0.01 tolerance', () => {
      expect(evaluateGridIn('3.02', 3.0)).toBe(false);
      expect(evaluateGridIn('3.1', 3.0)).toBe(false);
    });

    it('handles boundary at exactly 0.01 difference', () => {
      // Due to IEEE 754 floating point, Math.abs(3.01 - 3.0) is actually
      // 0.009999999999999787, which IS < 0.01, so this is accepted
      expect(evaluateGridIn('3.01', 3.0)).toBe(true);
    });

    it('tolerance works for negative numbers', () => {
      expect(evaluateGridIn('-3.005', -3.0)).toBe(true);
      expect(evaluateGridIn('-3.02', -3.0)).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('returns false for empty string', () => {
      expect(evaluateGridIn('', 5)).toBe(false);
    });

    it('returns false for non-numeric user input', () => {
      expect(evaluateGridIn('abc', 5)).toBe(false);
      expect(evaluateGridIn('hello', 3)).toBe(false);
    });

    it('returns false for non-numeric correct answer', () => {
      expect(evaluateGridIn('5', 'abc')).toBe(false);
    });

    it('returns false for both non-numeric', () => {
      expect(evaluateGridIn('abc', 'xyz')).toBe(false);
    });
  });

  describe('division by zero', () => {
    it('returns false when user enters 1/0 (Infinity is not NaN, but Infinity - number is Infinity)', () => {
      // parseGridInValue('1/0') returns Infinity
      // Math.abs(Infinity - 5) = Infinity which is not < 0.01
      expect(evaluateGridIn('1/0', 5)).toBe(false);
    });

    it('returns false for 0/0 (NaN)', () => {
      expect(evaluateGridIn('0/0', 5)).toBe(false);
    });
  });

  describe('real SAT question scenarios', () => {
    it('handles typical grid-in integer answer', () => {
      // "If 2x + y = 10 and x - y = 2, what is the value of x?" => 4
      expect(evaluateGridIn('4', 4)).toBe(true);
      expect(evaluateGridIn('3', 4)).toBe(false);
    });

    it('handles fraction as correct answer stored as number', () => {
      // correctAnswer might be stored as 0.75 but user types 3/4
      expect(evaluateGridIn('3/4', 0.75)).toBe(true);
    });

    it('handles integer correct answer stored as string', () => {
      expect(evaluateGridIn('4', '4')).toBe(true);
    });
  });
});
