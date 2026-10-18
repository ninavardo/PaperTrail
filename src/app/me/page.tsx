import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { ReliabilityChart } from "@/components/reliability-chart";
import { readAnonId } from "@/lib/anon";
import { isoDay } from "@/lib/dates";
import { buildProfile, type WrongEntry } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calibration" };

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n)}%`);

export default async function MePage() {
  const anonId = await readAnonId();
  const profile = anonId ? buildProfile(getDb(), anonId, new Date()) : null;

  if (!profile || profile.total === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-serif text-lead">Calibration</h1>
        <p className="mt-4">No guesses are on file for this browser. The profile starts with your first guess on <Link href="/today">Today</Link>.</p>
      </div>
    );
  }

  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">Ledger {anonId?.slice(0, 8)} · Anonymous</p>
        <h1 className="font-serif text-fact">
          Brier score {profile.brier === null ? "—" : profile.brier.toFixed(3)}
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          The mean squared gap between stated confidence and outcome. 0 is perfect. Answering everything at 50 percent scores 0.250.
        </p>

        <section aria-labelledby="reliability" className="mt-12">
          <h2 id="reliability" className="meta mb-4 border-b border-ink pb-1">
            Reliability
          </h2>
          <ReliabilityChart bins={profile.bins} />
          <table className="meta mt-6 w-full max-w-md border-collapse text-left">
            <caption className="sr-only-text">Accuracy by stated confidence</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="py-1 font-medium">Stated</th>
                <th scope="col" className="py-1 text-right font-medium">Guesses</th>
                <th scope="col" className="py-1 text-right font-medium">Mean stated</th>
                <th scope="col" className="py-1 text-right font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {profile.bins.map((b) => (
                <tr key={b.lo} className="border-b border-rule">
                  <th scope="row" className="py-1 font-normal">
                    {b.lo}–{b.hi}%
                  </th>
                  <td className="py-1 text-right">{b.count}</td>
                  <td className="py-1 text-right">{pct(b.meanConfidence)}</td>
                  <td className="py-1 text-right">{pct(b.accuracy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="wrong" className="mt-12">
          <h2 id="wrong" className="meta mb-4 border-b border-ink pb-1">
            Facts you got wrong ({profile.wrong.length})
          </h2>
          {profile.wrong.length === 0 ? (
            <p className="text-muted">None on file.</p>
          ) : (
            <ol className="space-y-5">
              {profile.wrong.map((w) => (
                <WrongItem key={w.factId} entry={w} />
              ))}
            </ol>
          )}
        </section>
      </article>

      <aside className="marginalia" aria-label="Totals">
        <dl className="meta grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
          <dt className="text-muted">Guesses</dt>
          <dd className="text-right">{profile.total}</dd>
          <dt className="text-muted">Correct</dt>
          <dd className="text-right">{profile.correct}</dd>
          <dt className="text-muted">Accuracy</dt>
          <dd className="text-right">{pct((profile.correct / profile.total) * 100)}</dd>
          <dt className="text-muted">Streak</dt>
          <dd className="text-right">
            {profile.streak} {profile.streak === 1 ? "day" : "days"}
          </dd>
        </dl>
      </aside>
    </div>
  );
}

function WrongItem({ entry }: { entry: WrongEntry }) {
  const g = entry.guess;
  const detail =
    g.kind === "number"
      ? `Entered ${g.guess}, recorded ${g.truth}, at ${g.confidence}%`
      : `Answered ${g.guess === 1 ? "true" : "false"}, correct answer ${g.truth === 1 ? "true" : "false"}, at ${g.confidence}%`;
  return (
    <li className="border-t border-rule pt-2">
      <p className="font-serif">{entry.sentence}</p>
      <p className="meta mt-1 text-muted">
        {isoDay(g.createdAt)} · {detail}
      </p>
    </li>
  );
}
