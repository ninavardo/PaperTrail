import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { facts, sources } from "@/db/schema";
import { factInputSchema, type FactInput } from "./validation";

/**
 * The only supported way to create a fact. Sources are inserted before the fact
 * inside one transaction; the deferred foreign key and the facts_require_source
 * trigger reject any fact that ends up without a source.
 */
export async function createFact(db: Db, input: FactInput): Promise<number> {
  const fact = factInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const row = await tx.get<{ next: number }>(
      sql`SELECT COALESCE(MAX(n), 0) + 1 AS next FROM (
            SELECT seq AS n FROM sqlite_sequence WHERE name = 'facts'
            UNION ALL SELECT MAX(id) FROM facts
          )`,
    );
    const id = row.next;
    await tx.insert(sources)
      .values(fact.sources.map((s) => ({ ...s, factId: id })))
      .run();
    await tx.insert(facts)
      .values({
        id,
        sentence: fact.sentence,
        category: fact.category,
        year: fact.year,
        grade: fact.grade,
        status: fact.status,
        createdAt: new Date(),
      })
      .run();
    return id;
  });
}
