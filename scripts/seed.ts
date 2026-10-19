import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createDbClient, databaseUrl } from "@/db/client";
import { facts, sources } from "@/db/schema";
import { migrate } from "@/db/migrate";
import * as schema from "@/db/schema";
import { SEED_CLAIMS, SEED_FACTS } from "@/db/seed-data";
import { createClaim } from "@/lib/claims";
import { createFact } from "@/lib/facts";

async function main(): Promise<void> {
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }

  const client = createDbClient(url);
  const db = drizzle(client, { schema });

  try {
    await migrate(client);
    const existing = await db.select({ id: facts.id }).from(facts).limit(1).all();
    if (existing.length > 0) {
      console.log(`Database ${url} already has facts; skipping seed.`);
      return;
    }

    for (const fact of SEED_FACTS) await createFact(db, fact);

    for (const claim of SEED_CLAIMS) {
      const sourceIds: number[] = [];
      for (const { url: sourceUrl, quote } of claim.cites) {
        const row = await db
          .select({ id: sources.id })
          .from(sources)
          .where(and(eq(sources.url, sourceUrl), eq(sources.quote, quote)))
          .get();
        if (!row) throw new Error(`Claim "${claim.text}" cites a source that was not seeded: ${sourceUrl}`);
        sourceIds.push(row.id);
      }
      await createClaim(db, {
        text: claim.text,
        verdict: claim.verdict,
        oneLineVerdict: claim.oneLineVerdict,
        sourceIds,
      });
    }

    console.log(`Seeded ${SEED_FACTS.length} facts and ${SEED_CLAIMS.length} claims into ${url}.`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
