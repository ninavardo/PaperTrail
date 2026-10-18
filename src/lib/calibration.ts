import { utcDayNumber } from "./dates";

export type Prediction = { confidence: number; correct: boolean };

/**
 * Mean squared error between stated probability and outcome.
 * 0 is perfect; answering every question at 50 percent scores 0.25.
 */
export function brierScore(predictions: Prediction[]): number | null {
  if (predictions.length === 0) return null;
  const total = predictions.reduce((sum, p) => {
    const probability = p.confidence / 100;
    const outcome = p.correct ? 1 : 0;
    return sum + (probability - outcome) ** 2;
  }, 0);
  return total / predictions.length;
}

export type ReliabilityBin = {
  lo: number;
  hi: number;
  count: number;
  meanConfidence: number | null;
  accuracy: number | null;
};

export const BIN_EDGES: ReadonlyArray<readonly [number, number]> = [
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 89],
  [90, 100],
];

/** Groups predictions by stated confidence and reports observed accuracy per group (both in percent). */
export function reliabilityBins(predictions: Prediction[]): ReliabilityBin[] {
  return BIN_EDGES.map(([lo, hi]) => {
    const inBin = predictions.filter((p) => p.confidence >= lo && p.confidence <= hi);
    if (inBin.length === 0) return { lo, hi, count: 0, meanConfidence: null, accuracy: null };
    const meanConfidence = inBin.reduce((s, p) => s + p.confidence, 0) / inBin.length;
    const accuracy = (inBin.filter((p) => p.correct).length / inBin.length) * 100;
    return { lo, hi, count: inBin.length, meanConfidence, accuracy };
  });
}

/**
 * Consecutive UTC days with at least one guess, ending today. A streak survives
 * until the end of today even if today's guess has not been made yet.
 */
export function currentStreak(guessDates: Date[], now: Date): number {
  const days = new Set(guessDates.map(utcDayNumber));
  let day = utcDayNumber(now);
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }
  return streak;
}
