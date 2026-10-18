import { randomInt } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { facts, sources, type Fact, type FactWithSources } from "@/db/schema";
import { utcDayNumber } from "./dates";

export function attachSources(db: Db, rows: Fact[]): FactWithSources[] {
  if (rows.length === 0) return [];
  const all = db
    .select()
    .from(sources)
    .where(inArray(sources.factId, rows.map((f) => f.id)))
    .orderBy(asc(sources.id))
    .all();
  return rows.map((f) => ({ ...f, sources: all.filter((s) => s.factId === f.id) }));
}

export function getFact(db: Db, id: number): FactWithSources | null {
  const row = db.select().from(facts).where(eq(facts.id, id)).get();
  return row ? attachSources(db, [row])[0] : null;
}

/** Verified facts in a stable order; the daily rotation walks this list. */
function rotation(db: Db, category?: string): Fact[] {
  const where = category
    ? and(eq(facts.status, "verified"), eq(facts.category, category))
    : eq(facts.status, "verified");
  return db.select().from(facts).where(where).orderBy(asc(facts.id)).all();
}

/** One fact per UTC day, optionally restricted to a category. */
export function getDailyFact(db: Db, date: Date, category?: string): FactWithSources | null {
  const list = rotation(db, category);
  if (list.length === 0) return null;
  const fact = list[utcDayNumber(date) % list.length];
  return attachSources(db, [fact])[0];
}

export function getRandomFact(db: Db, category?: string): FactWithSources | null {
  const list = rotation(db, category);
  if (list.length === 0) return null;
  return attachSources(db, [list[randomInt(list.length)]])[0];
}

export function allFactYears(db: Db): number[] {
  return db.select({ year: facts.year }).from(facts).all().map((r) => r.year);
}
