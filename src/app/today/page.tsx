import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { GuessCard } from "@/components/guess-card";
import { SponsorSlot } from "@/components/sponsor-slot";
import { readAnonId } from "@/lib/anon";
import { isoDay } from "@/lib/dates";
import { redactYears } from "@/lib/puzzle";
import { activeSponsor } from "@/lib/sponsors";
import { guessToday, todaysPuzzle, toReveal } from "@/lib/today";
import { submitGuess } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const db = getDb();
  const now = new Date();
  const today = todaysPuzzle(db, now);
  if (!today) {
    return <p className="meta">No verified entries are on file.</p>;
  }

  const anonId = await readAnonId();
  const existing = anonId ? guessToday(db, anonId, today.fact.id, now) : null;
  const entryLabel = `Entry ${String(today.fact.id).padStart(3, "0")} · ${isoDay(now)}`;
  const sponsor = activeSponsor(db, now);

  return (
    <>
      <GuessCard
        action={submitGuess}
        factId={today.fact.id}
        entryLabel={entryLabel}
        redactedSentence={redactYears(today.fact.sentence)}
        category={today.fact.category}
        puzzle={today.puzzle}
        initialReveal={existing ? toReveal(today.fact, existing, today.puzzle) : null}
      />
      {sponsor && <SponsorSlot sponsor={sponsor} />}
    </>
  );
}
