import { addDays, format, isBefore, startOfDay } from 'date-fns';
import type { SM2Data, SM2Rating, QuestionProgress } from '../types';

export function defaultSM2Data(): SM2Data {
  return { easeFactor: 2.5, interval: 0, repetition: 0, nextReviewDate: null };
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetition: number;
}

export function calculateSM2(
  rating: SM2Rating,
  prevEF: number,
  prevInterval: number,
  prevRepetition: number,
): SM2Result {
  let ef = prevEF;
  let interval: number;
  let repetition: number;

  if (rating < 3) {
    // Failed — reset
    repetition = 0;
    interval = 0;
  } else {
    // Successful recall
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEF);
    }
    repetition = prevRepetition + 1;
  }

  // Update ease factor
  ef = prevEF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  ef = Math.max(1.3, ef);

  return { easeFactor: ef, interval, repetition };
}

export function getDueQuestions(
  progress: Record<string, QuestionProgress>,
  today?: Date,
): string[] {
  const t = startOfDay(today ?? new Date());
  const due: string[] = [];

  for (const [id, qp] of Object.entries(progress)) {
    if (!qp.sm2?.nextReviewDate) continue;
    const reviewDate = startOfDay(new Date(qp.sm2.nextReviewDate));
    if (isBefore(reviewDate, t) || reviewDate.getTime() === t.getTime()) {
      due.push(id);
    }
  }

  return due;
}

export function getDueCount(
  progress: Record<string, QuestionProgress>,
  today?: Date,
): number {
  return getDueQuestions(progress, today).length;
}

export function computeNextReviewDate(interval: number, from?: Date): string {
  const base = from ?? new Date();
  return format(addDays(base, interval), 'yyyy-MM-dd');
}
