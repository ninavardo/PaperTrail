import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { GuessCard } from "@/components/guess-card";
import { readAnonId } from "@/lib/anon";
import { isoDay } from "@/lib/dates";
import { redactYears } from "@/lib/puzzle";
import { reviewPuzzle, reviewQueue } from "@/lib/review";
import { INTERVALS } from "@/lib/spaced-repetition";
import { submitReview } from "./actions";
import { NextReviewButton } from "./next-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review" };

const SCHEDULE_NOTE = `Missed entries return after ${INTERVALS.join(", ")} days. A miss at any stage starts the schedule again.`;

export default async function ReviewPage() {
  const anonId = await readAnonId();
  const db = getDb();
  const now = new Date();
  const queue = anonId ? reviewQueue(db, anonId, now) : { due: [], upcoming: [] };

  if (queue.due.length === 0) {
    return (
      <div className="ledger">
        <article>
          <h1 className="font-serif text-lead">Nothing is due for review.</h1>
          <p className="mt-4 max-w-xl text-muted">{SCHEDULE_NOTE}</p>
          {!anonId && (
            <p className="mt-4">
              Start with <Link href="/today">Today</Link>.
            </p>
          )}
        </article>
        <aside className="marginalia" aria-label="Upcoming reviews">
          <h2 className="meta mb-2 text-muted">Scheduled ({queue.upcoming.length})</h2>
          <ol className="meta space-y-1">
            {queue.upcoming.map((item) => (
              <li key={item.fact.id} className="flex justify-between gap-3 border-t border-rule pt-1">
                <span>Entry {String(item.fact.id).padStart(3, "0")}</span>
                <span>{isoDay(item.dueAt)}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    );
  }

  const item = queue.due[0];
  const label = `Review 1 of ${queue.due.length} · Entry ${String(item.fact.id).padStart(3, "0")} · ${INTERVALS[item.stage]}-day interval`;

  return (
    <GuessCard
      key={item.fact.id}
      action={submitReview}
      factId={item.fact.id}
      entryLabel={label}
      redactedSentence={redactYears(item.fact.sentence)}
      category={item.fact.category}
      puzzle={reviewPuzzle(db, item.fact, now)}
      initialReveal={null}
      afterReveal={<NextReviewButton />}
    />
  );
}
