import { addDays, startOfUtcDay } from "./dates";

/** Days until a missed fact resurfaces, by review stage. */
export const INTERVALS = [1, 3, 7, 21] as const;

export type Attempt = { at: Date; correct: boolean };

export type Schedule =
  | { state: "none" } // never missed
  | { state: "learning"; stage: number; dueAt: Date }
  | { state: "graduated" }; // passed the 21-day review

/**
 * Replays a user's attempts at one fact (any order) and returns its review schedule.
 * A miss schedules a review 1 day later. Each correct review advances to the next
 * interval (3, 7, 21 days); a correct answer at the 21-day review graduates the fact.
 * A miss at any point starts again at 1 day. Due dates fall at the start of a UTC day.
 */
export function schedule(attempts: Attempt[]): Schedule {
  const ordered = [...attempts].sort((a, b) => a.at.getTime() - b.at.getTime());
  let current: Schedule = { state: "none" };
  for (const attempt of ordered) {
    if (!attempt.correct) {
      current = { state: "learning", stage: 0, dueAt: dueAfter(attempt.at, 0) };
    } else if (current.state === "learning") {
      const stage: number = current.stage + 1;
      current = stage >= INTERVALS.length ? { state: "graduated" } : { state: "learning", stage, dueAt: dueAfter(attempt.at, stage) };
    }
  }
  return current;
}

function dueAfter(at: Date, stage: number): Date {
  return addDays(startOfUtcDay(at), INTERVALS[stage]);
}

export function isDue(s: Schedule, now: Date): boolean {
  return s.state === "learning" && s.dueAt.getTime() <= now.getTime();
}
