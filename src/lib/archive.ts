import { and, asc, count, eq, gte, inArray, lte, max, min, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { facts, GRADES, type FactWithSources } from "@/db/schema";
import { attachSources } from "./queries";
import { categorySchema } from "./validation";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

export const archiveQuerySchema = z.object({
  q: optional(z.string().trim().max(100)),
  category: optional(categorySchema),
  grade: optional(z.enum(GRADES)),
  from: optional(z.coerce.number().int().min(-5000).max(3000)),
  to: optional(z.coerce.number().int().min(-5000).max(3000)),
});

export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;

/** Accepts raw search params; anything invalid is dropped rather than failing the page. */
export function parseArchiveQuery(params: Record<string, string | string[] | undefined>): ArchiveQuery {
  const query: ArchiveQuery = {};
  for (const key of Object.keys(archiveQuerySchema.shape) as Array<keyof ArchiveQuery>) {
    const raw = params[key];
    const field = archiveQuerySchema.shape[key].safeParse(Array.isArray(raw) ? raw[0] : raw);
    if (field.success && field.data !== undefined) Object.assign(query, { [key]: field.data });
  }
  return query;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Verified and disputed facts; retired facts keep their permalinks but leave the index. */
export async function searchArchive(db: Db, query: ArchiveQuery): Promise<FactWithSources[]> {
  const conditions: SQL[] = [inArray(facts.status, ["verified", "disputed"])];
  if (query.q) conditions.push(sql`${facts.sentence} LIKE ${`%${escapeLike(query.q)}%`} ESCAPE '\\'`);
  if (query.category) conditions.push(eq(facts.category, query.category));
  if (query.grade) conditions.push(eq(facts.grade, query.grade));
  if (query.from !== undefined) conditions.push(gte(facts.year, query.from));
  if (query.to !== undefined) conditions.push(lte(facts.year, query.to));
  const rows = await db
    .select()
    .from(facts)
    .where(and(...conditions))
    .orderBy(asc(facts.year), asc(facts.id))
    .all();
  return attachSources(db, rows);
}

export type ArchiveFacets = { categories: Array<{ category: string; count: number }>; minYear: number; maxYear: number };

export async function archiveFacets(db: Db): Promise<ArchiveFacets> {
  const listed = inArray(facts.status, ["verified", "disputed"]);
  const categories = await db
    .select({ category: facts.category, count: count() })
    .from(facts)
    .where(listed)
    .groupBy(facts.category)
    .orderBy(asc(facts.category))
    .all();
  const range = await db.select({ lo: min(facts.year), hi: max(facts.year) }).from(facts).where(listed).get();
  return { categories, minYear: range?.lo ?? 0, maxYear: range?.hi ?? 0 };
}
