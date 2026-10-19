import type { Db } from "@/db/client";
import type { FactWithSources } from "@/db/schema";
import { utcDayNumber } from "./dates";
import { guessesFor } from "./profile";
import { puzzleFor, sliderRange, type Puzzle } from "./puzzle";
import { allFactYears, getFact } from "./queries";
import { isDue, schedule } from "./spaced-repetition";

/** Reviews use the same puzzle rules as Today, keyed to the day of the review. */
export async function reviewPuzzle(db: Db, fact: FactWithSources, now: Date): Promise<Puzzle> {
  return puzzleFor(fact, utcDayNumber(now), sliderRange(await allFactYears(db)));
}

export type ReviewItem = { fact: FactWithSources; stage: number; dueAt: Date };

export async function reviewQueue(db: Db, anonId: string, now: Date): Promise<{ due: ReviewItem[]; upcoming: ReviewItem[] }> {
  const byFact = new Map<number, Array<{ at: Date; correct: boolean }>>();
  for (const g of await guessesFor(db, anonId)) {
    const list = byFact.get(g.factId) ?? [];
    list.push({ at: g.createdAt, correct: g.correct });
    byFact.set(g.factId, list);
  }

  const due: ReviewItem[] = [];
  const upcoming: ReviewItem[] = [];
  for (const [factId, attempts] of byFact) {
    const s = schedule(attempts);
    if (s.state !== "learning") continue;
    const fact = await getFact(db, factId);
    if (!fact || fact.status === "retired") continue;
    const item = { fact, stage: s.stage, dueAt: s.dueAt };
    (isDue(s, now) ? due : upcoming).push(item);
  }
  const byDue = (a: ReviewItem, b: ReviewItem) => a.dueAt.getTime() - b.dueAt.getTime() || a.fact.id - b.fact.id;
  return { due: due.sort(byDue), upcoming: upcoming.sort(byDue) };
}
