import { desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { claims, facts, sources, type Claim, type Source } from "@/db/schema";

export type ClaimWithSources = Claim & { sources: Source[] };

export async function listClaims(db: Db): Promise<ClaimWithSources[]> {
  const rows = await db.select().from(claims).orderBy(desc(claims.id)).all();
  const ids = [...new Set(rows.flatMap((c) => c.sourceIds))];
  const found = ids.length ? await db.select().from(sources).where(inArray(sources.id, ids)).all() : [];
  const byId = new Map(found.map((s) => [s.id, s]));
  return rows.map((c) => ({
    ...c,
    sources: c.sourceIds.flatMap((id) => {
      const s = byId.get(id);
      return s ? [s] : [];
    }),
  }));
}

export type CitableSource = { id: number; publisher: string; quote: string; factId: number; factSentence: string };

/** Every source in the ledger, for citing in a new claim. */
export async function citableSources(db: Db): Promise<CitableSource[]> {
  return db
    .select({
      id: sources.id,
      publisher: sources.publisher,
      quote: sources.quote,
      factId: facts.id,
      factSentence: facts.sentence,
    })
    .from(sources)
    .innerJoin(facts, eq(sources.factId, facts.id))
    .orderBy(facts.id, sources.id)
    .all();
}
