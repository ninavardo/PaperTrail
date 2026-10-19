import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { facts, guesses, type Guess } from "@/db/schema";
import { brierScore, currentStreak, reliabilityBins, type ReliabilityBin } from "./calibration";

export type WrongEntry = { factId: number; sentence: string; guess: Guess };

export type Profile = {
  total: number;
  correct: number;
  brier: number | null;
  bins: ReliabilityBin[];
  streak: number;
  wrong: WrongEntry[];
};

export async function guessesFor(db: Db, anonId: string): Promise<Guess[]> {
  return db.select().from(guesses).where(eq(guesses.anonId, anonId)).orderBy(asc(guesses.createdAt), asc(guesses.id)).all();
}

export async function buildProfile(db: Db, anonId: string, now: Date): Promise<Profile> {
  const all = await guessesFor(db, anonId);

  const firstByFact = new Map<number, Guess>();
  for (const g of all) if (!firstByFact.has(g.factId)) firstByFact.set(g.factId, g);
  const wrongFirst = [...firstByFact.values()].filter((g) => !g.correct);

  const sentences = new Map(
    (await db.select({ id: facts.id, sentence: facts.sentence }).from(facts).all()).map((f) => [f.id, f.sentence]),
  );

  return {
    total: all.length,
    correct: all.filter((g) => g.correct).length,
    brier: brierScore(all),
    bins: reliabilityBins(all),
    streak: currentStreak(
      all.map((g) => g.createdAt),
      now,
    ),
    wrong: wrongFirst
      .reverse()
      .map((guess) => ({ factId: guess.factId, sentence: sentences.get(guess.factId) ?? "", guess })),
  };
}
