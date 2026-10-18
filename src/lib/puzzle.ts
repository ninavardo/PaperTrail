import type { GuessKind } from "@/db/schema";

/** A year guess counts as correct within this many years of the recorded year. */
export const YEAR_TOLERANCE = 10;

export type Puzzle =
  | { kind: "number"; min: number; max: number }
  | { kind: "truefalse"; decoyYear: number };

const YEAR_PATTERN = /\b(1[0-9]{3}|20[0-9]{2})\b/g;

/** Hides every four-digit year so the sentence cannot give away the answer. */
export function redactYears(sentence: string): string {
  return sentence.replace(YEAR_PATTERN, "████");
}

/** Small deterministic integer hash (FNV-1a) so a puzzle is stable for a given day. */
function hash(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(parts.join(":"))) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function puzzleFor(
  fact: { id: number; year: number },
  day: number,
  yearRange: { min: number; max: number },
): Puzzle {
  if (day % 2 === 0) return { kind: "number", min: yearRange.min, max: yearRange.max };
  const h = hash(fact.id, day);
  const offset = 5 + (h % 36);
  const decoyYear = h & 0x100 ? fact.year + offset : fact.year - offset + 1;
  return { kind: "truefalse", decoyYear };
}

/** Slider bounds: whole centuries around the catalogue, so the range itself leaks nothing. */
export function sliderRange(years: number[]): { min: number; max: number } {
  const min = Math.min(...years);
  const max = Math.max(...years);
  return { min: Math.floor(min / 100) * 100, max: Math.ceil((max + 1) / 100) * 100 };
}

export type Scored = { kind: GuessKind; guess: number; truth: number; correct: boolean };

/**
 * number: guess is a year, truth is the recorded year.
 * truefalse: the statement is "this happened before decoyYear"; guess and truth are 1 (true) or 0 (false).
 */
export function scoreGuess(puzzle: Puzzle, year: number, guess: number): Scored {
  if (puzzle.kind === "number") {
    return { kind: "number", guess, truth: year, correct: Math.abs(guess - year) <= YEAR_TOLERANCE };
  }
  const truth = year < puzzle.decoyYear ? 1 : 0;
  return { kind: "truefalse", guess, truth, correct: guess === truth };
}
