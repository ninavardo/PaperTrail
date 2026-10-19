"use server";

import { getDb } from "@/db/client";
import { ensureAnonId } from "@/lib/anon";
import { guessFitsPuzzle, INVALID_GUESS, parseGuessForm } from "@/lib/guess-form";
import { guessToday, recordGuess, todaysPuzzle, toReveal, type GuessState } from "@/lib/today";

export async function submitGuess(_prev: GuessState, formData: FormData): Promise<GuessState> {
  const form = parseGuessForm(formData);
  if (!form) return { reveal: null, error: INVALID_GUESS };

  const db = getDb();
  const now = new Date();
  const today = await todaysPuzzle(db, now);
  if (!today || today.fact.id !== form.factId) {
    return { reveal: null, error: "The day's entry has changed. Reload the page for the current one." };
  }
  if (!guessFitsPuzzle(today.puzzle, form.guess)) return { reveal: null, error: INVALID_GUESS };

  const anonId = await ensureAnonId();
  const guess =
    (await guessToday(db, anonId, today.fact.id, now)) ??
    (await recordGuess(db, { anonId, fact: today.fact, puzzle: today.puzzle, guess: form.guess, confidence: form.confidence, now }));

  return { reveal: toReveal(today.fact, guess, today.puzzle), error: null };
}
