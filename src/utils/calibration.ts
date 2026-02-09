import type { CalibrationData } from '../types';

export type CalibrationLabel = 'well-calibrated' | 'overconfident' | 'underconfident' | 'insufficient-data';

export interface CalibrationResult {
  label: CalibrationLabel;
  score: number; // -1 to 1: negative = overconfident, positive = underconfident, 0 = perfect
  totalRated: number;
  wellCalibratedPercent: number;
}

export function calculateCalibration(data: CalibrationData): CalibrationResult {
  const { recentAttempts } = data;

  if (recentAttempts.length < 10) {
    return { label: 'insufficient-data', score: 0, totalRated: recentAttempts.length, wellCalibratedPercent: 0 };
  }

  let wellCalibrated = 0;
  let overconfident = 0;
  let underconfident = 0;

  for (const a of recentAttempts) {
    if ((a.confident && a.correct) || (!a.confident && !a.correct)) {
      wellCalibrated++;
    } else if (a.confident && !a.correct) {
      overconfident++;
    } else {
      underconfident++;
    }
  }

  const total = recentAttempts.length;
  const wellCalibratedPercent = Math.round((wellCalibrated / total) * 100);

  // Score: negative = overconfident, positive = underconfident
  const score = (underconfident - overconfident) / total;

  let label: CalibrationLabel;
  if (wellCalibratedPercent >= 60) {
    label = 'well-calibrated';
  } else if (overconfident > underconfident) {
    label = 'overconfident';
  } else {
    label = 'underconfident';
  }

  return { label, score, totalRated: total, wellCalibratedPercent };
}
