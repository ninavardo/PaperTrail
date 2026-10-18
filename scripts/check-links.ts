/**
 * Link-rot watchdog. Checks every source URL (HEAD, falling back to GET), records the
 * status code and check time, and marks verified facts whose sources are all dead as
 * "disputed". Run from cron, e.g. weekly:
 *   0 3 * * 1  cd /srv/paper-trail && npm run -s links:check
 * Flags: --dry-run (check and report, write nothing), --concurrency=N (default 4).
 */
import { databaseFile, openDb } from "@/db/client";
import { sources } from "@/db/schema";
import {
  checkUrl,
  factLinks,
  factsRecovered,
  factsToDispute,
  isDead,
  markDisputed,
  recordResults,
  type CheckResult,
} from "@/lib/link-check";

function flag(name: string): string | undefined {
  const arg = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return arg === undefined ? undefined : (arg.split("=")[1] ?? "");
}

async function main(): Promise<number> {
  const dryRun = flag("dry-run") !== undefined;
  const concurrency = Math.max(1, Number(flag("concurrency") ?? 4) || 4);
  const { db, sqlite } = openDb(databaseFile());

  try {
    const all = db.select({ id: sources.id, factId: sources.factId, url: sources.url }).from(sources).all();
    const results: CheckResult[] = [];
    let next = 0;

    async function worker() {
      while (next < all.length) {
        const s = all[next++];
        const { status, error } = await checkUrl(s.url);
        results.push({ sourceId: s.id, status, error });
        const label = status === null ? `no response (${error})` : String(status);
        console.log(`${isDead(status) ? "DEAD" : "ok  "}  ${label.padEnd(5)}  source ${s.id} (entry ${s.factId})  ${s.url}`);
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, all.length) }, worker));

    const checkedAt = new Date();
    const dead = results.filter((r) => isDead(r.status)).length;

    if (dryRun) {
      // Evaluate disputes against this run's results without touching the database.
      const statusById = new Map(results.map((r) => [r.sourceId, r.status]));
      const rows = factLinks(db).map((f) => ({
        ...f,
        sources: all.filter((s) => s.factId === f.factId).map((s) => statusById.get(s.id) ?? "unchecked"),
      }));
      console.log(`\nDry run: ${all.length} sources, ${dead} dead. Would dispute: ${factsToDispute(rows).join(", ") || "none"}.`);
      return 0;
    }

    recordResults(db, results, checkedAt);
    const rows = factLinks(db);
    const disputed = factsToDispute(rows);
    markDisputed(db, disputed);
    const recovered = factsRecovered(rows);

    console.log(`\n${all.length} sources checked, ${dead} dead.`);
    console.log(`Marked disputed: ${disputed.length ? disputed.map((id) => `entry ${id}`).join(", ") : "none"}.`);
    if (recovered.length) {
      console.log(`Disputed entries with a live source again (review by hand): ${recovered.map((id) => `entry ${id}`).join(", ")}.`);
    }
    return 0;
  } finally {
    sqlite.close();
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
