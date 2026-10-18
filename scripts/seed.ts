import { and, eq } from "drizzle-orm";
import { databaseFile, openDb } from "@/db/client";
import { facts, sources } from "@/db/schema";
import { SEED_CLAIMS, SEED_FACTS } from "@/db/seed-data";
import { createClaim } from "@/lib/claims";
import { createFact } from "@/lib/facts";

const file = databaseFile();
const { db, sqlite } = openDb(file);

const existing = db.select({ id: facts.id }).from(facts).limit(1).all();
if (existing.length > 0) {
  console.log(`Database ${file} already has facts; skipping seed. Delete the file to reseed.`);
  process.exit(0);
}

for (const fact of SEED_FACTS) createFact(db, fact);

for (const claim of SEED_CLAIMS) {
  const sourceIds = claim.cites.map(({ url, quote }) => {
    const row = db
      .select({ id: sources.id })
      .from(sources)
      .where(and(eq(sources.url, url), eq(sources.quote, quote)))
      .get();
    if (!row) throw new Error(`Claim "${claim.text}" cites a source that was not seeded: ${url}`);
    return row.id;
  });
  createClaim(db, { text: claim.text, verdict: claim.verdict, oneLineVerdict: claim.oneLineVerdict, sourceIds });
}

console.log(`Seeded ${SEED_FACTS.length} facts and ${SEED_CLAIMS.length} claims into ${file}.`);
sqlite.close();
