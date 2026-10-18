import { z } from "zod";
import type { Puzzle } from "./puzzle";

const guessFormSchema = z.object({
  factId: z.coerce.number().int().positive(),
  guess: z.coerce.number().int().min(-3000).max(2100),
  confidence: z.coerce.number().int().min(50).max(100),
});

export type GuessForm = z.infer<typeof guessFormSchema>;

export function parseGuessForm(formData: FormData): GuessForm | null {
  const parsed = guessFormSchema.safeParse({
    factId: formData.get("factId"),
    guess: formData.get("guess"),
    confidence: formData.get("confidence"),
  });
  return parsed.success ? parsed.data : null;
}

export function guessFitsPuzzle(puzzle: Puzzle, guess: number): boolean {
  return puzzle.kind === "number" ? guess >= puzzle.min && guess <= puzzle.max : guess === 0 || guess === 1;
}

export const INVALID_GUESS = "Choose an answer and a confidence between 50 and 100 percent.";
