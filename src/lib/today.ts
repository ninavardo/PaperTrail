import { and, desc, eq, gte } from "drizzle-orm";
import type { Db } from "@/db/client";
import { guesses, type FactWithSources, type Grade, type Guess } from "@/db/schema";
import { startOfUtcDay, utcDayNumber } from "./dates";
import { puzzleFor, scoreGuess, sliderRange, type Puzzle } from "./puzzle";
import { allFactYears, getDailyFact } from "./queries";

export type TodayPuzzle = { fact: FactWithSources; puzzle: Puzzle; day: number };

export function todaysPuzzle(db: Db, now: Date): TodayPuzzle | null {
  const fact = getDailyFact(db, now);
  if (!fact) return null;
  const day = utcDayNumber(now);
  return { fact, day, puzzle: puzzleFor(fact, day, sliderRange(allFactYears(db))) };
}

export function guessToday(db: Db, anonId: string, factId: number, now: Date): Guess | null {
  return (
    db
      .select()
      .from(guesses)
      .where(and(eq(guesses.anonId, anonId), eq(guesses.factId, factId), gte(guesses.createdAt, startOfUtcDay(now))))
      .orderBy(desc(guesses.id))
      .get() ?? null
  );
}

export function recordGuess(
  db: Db,
  input: { anonId: string; fact: { id: number; year: number }; puzzle: Puzzle; guess: number; confidence: number; now: Date },
): Guess {
  const scored = scoreGuess(input.puzzle, input.fact.year, input.guess);
  return db
    .insert(guesses)
    .values({
      anonId: input.anonId,
      factId: input.fact.id,
      kind: scored.kind,
      guess: scored.guess,
      truth: scored.truth,
      confidence: input.confidence,
      correct: scored.correct,
      createdAt: input.now,
    })
    .returning()
    .get();
}

export type GuessState = { reveal: RevealData | null; error: string | null };

/** Everything the reveal needs; only sent to the client after a guess exists. */
export type RevealData = {
  factId: number;
  sentence: string;
  year: number;
  category: string;
  grade: Grade;
  sources: Array<{ id: number; url: string; archiveUrl: string | null; publisher: string; quote: string }>;
  result: { kind: Guess["kind"]; guess: number; truth: number; correct: boolean; confidence: number; decoyYear: number | null };
};

export function toReveal(fact: FactWithSources, guess: Guess, puzzle: Puzzle): RevealData {
  return {
    factId: fact.id,
    sentence: fact.sentence,
    year: fact.year,
    category: fact.category,
    grade: fact.grade,
    sources: fact.sources.map(({ id, url, archiveUrl, publisher, quote }) => ({ id, url, archiveUrl, publisher, quote })),
    result: {
      kind: guess.kind,
      guess: guess.guess,
      truth: guess.truth,
      correct: guess.correct,
      confidence: guess.confidence,
      decoyYear: puzzle.kind === "truefalse" ? puzzle.decoyYear : null,
    },
  };
}
