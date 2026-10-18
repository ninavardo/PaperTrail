import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { subscribers, type Subscriber } from "@/db/schema";

export const emailSchema = z.email("Enter a valid email address.").max(254).toLowerCase();

type Purpose = "confirm" | "unsubscribe";

export class EmailNotConfiguredError extends Error {}

function secret(): string {
  const value = process.env.EMAIL_TOKEN_SECRET;
  if (!value || value.length < 16) throw new EmailNotConfiguredError("EMAIL_TOKEN_SECRET must be at least 16 characters.");
  return value;
}

export function emailConfigured(): boolean {
  const value = process.env.EMAIL_TOKEN_SECRET;
  return Boolean(value && value.length >= 16);
}

/**
 * Tokens are derived from the subscriber's id and address, so nothing extra is stored
 * and a token stops working once the row is deleted.
 */
export function tokenFor(purpose: Purpose, s: Pick<Subscriber, "id" | "email">): string {
  return createHmac("sha256", secret()).update(`${purpose}:${s.id}:${s.email.toLowerCase()}`).digest("base64url");
}

export function tokenValid(purpose: Purpose, s: Pick<Subscriber, "id" | "email">, token: string): boolean {
  const expected = Buffer.from(tokenFor(purpose, s));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const tokenParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

/** Returns the subscriber that should receive a confirmation email, or null if already confirmed. */
export function subscribe(db: Db, email: string): Subscriber | null {
  const address = emailSchema.parse(email);
  const existing = db
    .select()
    .from(subscribers)
    .where(sql`${subscribers.email} = ${address} COLLATE NOCASE`)
    .get();
  if (existing) return existing.confirmedAt ? null : existing;
  return db.insert(subscribers).values({ email: address }).returning().get();
}

export function findSubscriber(db: Db, id: number): Subscriber | null {
  return db.select().from(subscribers).where(eq(subscribers.id, id)).get() ?? null;
}

export function confirmSubscriber(db: Db, id: number, token: string, now: Date): Subscriber | null {
  const s = findSubscriber(db, id);
  if (!s || !tokenValid("confirm", s, token)) return null;
  if (s.confirmedAt) return s;
  return db.update(subscribers).set({ confirmedAt: now }).where(eq(subscribers.id, id)).returning().get();
}

/** Deletes the subscriber outright; no address is kept after unsubscribing. */
export function unsubscribe(db: Db, id: number, token: string): boolean {
  const s = findSubscriber(db, id);
  if (!s || !tokenValid("unsubscribe", s, token)) return false;
  db.delete(subscribers).where(eq(subscribers.id, id)).run();
  return true;
}

export function confirmedSubscribers(db: Db): Subscriber[] {
  return db.select().from(subscribers).where(isNotNull(subscribers.confirmedAt)).all();
}

export function confirmUrl(origin: string, s: Pick<Subscriber, "id" | "email">): string {
  return `${origin}/subscribe/confirm?id=${s.id}&token=${tokenFor("confirm", s)}`;
}

export function unsubscribeUrl(origin: string, s: Pick<Subscriber, "id" | "email">): string {
  return `${origin}/unsubscribe?id=${s.id}&token=${tokenFor("unsubscribe", s)}`;
}

/** Public origin for links in emails and feeds, where no request is available. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
