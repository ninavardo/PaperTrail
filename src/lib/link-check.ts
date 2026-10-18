import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { facts, sources, type Status } from "@/db/schema";

/** null means no HTTP response at all (DNS failure, refused connection, timeout). */
export type CheckResult = { sourceId: number; status: number | null; error?: string };

/**
 * A link is dead when nothing answers or the server says the page is gone or broken.
 * 401, 403 and 429 mean the server is up but refusing automated requests, which says
 * nothing about whether the page exists, so they count as alive.
 */
export function isDead(status: number | null): boolean {
  if (status === null) return true;
  return status === 404 || status === 410 || status === 451 || status >= 500;
}

/** A source's last recorded check; "unchecked" is never evidence of rot. */
export type SourceState = number | null | "unchecked";

export type FactLinks = { factId: number; status: Status; sources: SourceState[] };

const dead = (s: SourceState) => s !== "unchecked" && isDead(s);
const alive = (s: SourceState) => s !== "unchecked" && !isDead(s);

/** Verified facts whose every source is dead. Retired facts are left alone. */
export function factsToDispute(rows: FactLinks[]): number[] {
  return rows
    .filter((r) => r.status === "verified" && r.sources.length > 0 && r.sources.every(dead))
    .map((r) => r.factId);
}

/** Disputed facts with a live source again; reported for a human to review, never restored automatically. */
export function factsRecovered(rows: FactLinks[]): number[] {
  return rows.filter((r) => r.status === "disputed" && r.sources.some(alive)).map((r) => r.factId);
}

const USER_AGENT = "PaperTrailLinkCheck/1.0 (+source verification; HEAD then GET)";

const NOT_FOUND_PATH = /(^|\/)(not-?found|page-not-found|404|error)(\/|\.|$)/i;

/** Some sites redirect missing pages to a "not found" page that answers 200; those count as 404. */
export function softNotFound(requested: string, final: string, redirected: boolean): boolean {
  if (!redirected) return false;
  const before = new URL(requested).pathname;
  const after = new URL(final).pathname;
  return before !== after && NOT_FOUND_PATH.test(after);
}

async function request(url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<number> {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8" },
  });
  await response.body?.cancel();
  return softNotFound(url, response.url, response.redirected) ? 404 : response.status;
}

/** HEAD first; some servers reject HEAD (405, 501) or mishandle it, so those are retried with GET. */
export async function checkUrl(url: string, timeoutMs = 15_000): Promise<{ status: number | null; error?: string }> {
  try {
    const status = await request(url, "HEAD", timeoutMs);
    if (status !== 405 && status !== 501 && !isDead(status)) return { status };
    return { status: await request(url, "GET", timeoutMs) };
  } catch (headError) {
    try {
      return { status: await request(url, "GET", timeoutMs) };
    } catch (error) {
      const reason = error instanceof Error ? (error.cause instanceof Error ? error.cause.message : error.message) : String(error);
      return { status: null, error: reason || String(headError) };
    }
  }
}

export function recordResults(db: Db, results: CheckResult[], checkedAt: Date): void {
  db.transaction((tx) => {
    for (const r of results) {
      tx.update(sources).set({ lastStatusCode: r.status, lastCheckedAt: checkedAt }).where(eq(sources.id, r.sourceId)).run();
    }
  });
}

export function factLinks(db: Db): FactLinks[] {
  const rows = db
    .select({ factId: facts.id, status: facts.status, sourceStatus: sources.lastStatusCode, checkedAt: sources.lastCheckedAt })
    .from(facts)
    .innerJoin(sources, eq(sources.factId, facts.id))
    .all();
  const byFact = new Map<number, FactLinks>();
  for (const r of rows) {
    const entry = byFact.get(r.factId) ?? { factId: r.factId, status: r.status, sources: [] };
    entry.sources.push(r.checkedAt ? r.sourceStatus : "unchecked");
    byFact.set(r.factId, entry);
  }
  return [...byFact.values()];
}

export function markDisputed(db: Db, factIds: number[]): void {
  if (factIds.length === 0) return;
  db.update(facts).set({ status: "disputed" }).where(inArray(facts.id, factIds)).run();
}
