/**
 * Grid-in answer evaluation utilities.
 *
 * Extracted from Practice.tsx / MockTest.tsx to allow sharing and unit testing.
 */

/**
 * Parses a numeric value from a string or number.
 * Handles fractions like "3/4" by evaluating numerator/denominator.
 */
export function parseGridInValue(v: string | number): number {
  const s = String(v).trim();
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    return Number(num) / Number(den);
  }
  return Number(s);
}

/**
 * Evaluates whether a user's grid-in answer matches the correct answer.
 *
 * - Parses fractions (e.g., "3/4" -> 0.75)
 * - Uses a tolerance of 0.01 for numeric comparison
 * - Returns false for NaN values
 */
export function evaluateGridIn(
  userAnswer: string | number,
  correctAnswer: string | number,
): boolean {
  const userVal = parseGridInValue(userAnswer);
  const correctVal = parseGridInValue(correctAnswer);
  if (isNaN(userVal) || isNaN(correctVal)) return false;
  return Math.abs(userVal - correctVal) < 0.01;
}
