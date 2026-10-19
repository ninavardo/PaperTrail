import { randomInt } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { facts, sources, type Fact, type FactWithSources } from "@/db/schema";
import { utcDayNumber } from "./dates";

export async function attachSources(db: Db, rows: Fact[]): Promise<FactWithSources[]> {
  if (rows.length === 0) return [];
  const all = await db
    .select()
    .from(sources)
    .where(inArray(sources.factId, rows.map((f) => f.id)))
    .orderBy(asc(sources.id))
    .all();
  return rows.map((f) => ({ ...f, sources: all.filter((s) => s.factId === f.id) }));
}

export async function getFact(db: Db, id: number): Promise<FactWithSources | null> {
  const row = await db.select().from(facts).where(eq(facts.id, id)).get();
  return row ? (await attachSources(db, [row]))[0] : null;
}

/** Verified facts in a stable order; the daily rotation walks this list. */
async function rotation(db: Db, category?: string): Promise<Fact[]> {
  const where = category
    ? and(eq(facts.status, "verified"), eq(facts.category, category))
    : eq(facts.status, "verified");
  return db.select().from(facts).where(where).orderBy(asc(facts.id)).all();
}

/** One fact per UTC day, optionally restricted to a category. */
export async function getDailyFact(db: Db, date: Date, category?: string): Promise<FactWithSources | null> {
  const list = await rotation(db, category);
  if (list.length === 0) return null;
  const fact = list[utcDayNumber(date) % list.length];
  return (await attachSources(db, [fact]))[0];
}

export async function getRandomFact(db: Db, category?: string): Promise<FactWithSources | null> {
  const list = await rotation(db, category);
  if (list.length === 0) return null;
  return (await attachSources(db, [list[randomInt(list.length)]]))[0];
}

export async function allFactYears(db: Db): Promise<number[]> {
  return (await db.select({ year: facts.year }).from(facts).all()).map((r) => r.year);
}
