"use server";

import { getDb } from "@/db/client";
import { readAnonId } from "@/lib/anon";
import { guessFitsPuzzle, INVALID_GUESS, parseGuessForm } from "@/lib/guess-form";
import { reviewPuzzle, reviewQueue } from "@/lib/review";
import { recordGuess, toReveal, type GuessState } from "@/lib/today";

export async function submitReview(_prev: GuessState, formData: FormData): Promise<GuessState> {
  const form = parseGuessForm(formData);
  if (!form) return { reveal: null, error: INVALID_GUESS };

  const anonId = await readAnonId();
  if (!anonId) return { reveal: null, error: "No review history for this browser." };

  const db = getDb();
  const now = new Date();
  const item = (await reviewQueue(db, anonId, now)).due.find((d) => d.fact.id === form.factId);
  if (!item) return { reveal: null, error: "That entry is not due for review. Reload the page." };

  const puzzle = await reviewPuzzle(db, item.fact, now);
  if (!guessFitsPuzzle(puzzle, form.guess)) return { reveal: null, error: INVALID_GUESS };

  const guess = await recordGuess(db, { anonId, fact: item.fact, puzzle, guess: form.guess, confidence: form.confidence, now });
  return { reveal: toReveal(item.fact, guess, puzzle), error: null };
}
