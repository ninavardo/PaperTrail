import { beforeEach, describe, expect, it, vi } from "vitest";
import { openDb, type Db } from "@/db/client";
import { migrate } from "@/db/migrate";
import { confirmedSubscribers, confirmSubscriber, subscribe, tokenFor, tokenValid, unsubscribe } from "./subscriptions";

let db: Db;

beforeEach(async () => {
  vi.stubEnv("EMAIL_TOKEN_SECRET", "test-secret-0123456789");
  const opened = openDb(":memory:");
  await migrate(opened.client);
  db = opened.db;
});

describe("tokens", () => {
  const s = { id: 7, email: "reader@example.com" };

  it("accepts the token it issued and rejects others", () => {
    expect(tokenValid("confirm", s, tokenFor("confirm", s))).toBe(true);
    expect(tokenValid("confirm", s, tokenFor("unsubscribe", s))).toBe(false);
    expect(tokenValid("confirm", { ...s, id: 8 }, tokenFor("confirm", s))).toBe(false);
    expect(tokenValid("confirm", s, "short")).toBe(false);
  });

  it("stops working when the secret changes", () => {
    const token = tokenFor("unsubscribe", s);
    vi.stubEnv("EMAIL_TOKEN_SECRET", "another-secret-0123456789");
    expect(tokenValid("unsubscribe", s, token)).toBe(false);
  });
});

describe("double opt-in", () => {
  it("stores one unconfirmed row per address, ignoring case", async () => {
    const first = (await subscribe(db, "Reader@Example.com"))!;
    const again = (await subscribe(db, "reader@example.com"))!;
    expect(again.id).toBe(first.id);
    expect(first.email).toBe("reader@example.com");
    expect(await confirmedSubscribers(db)).toHaveLength(0);
  });

  it("sends nothing until confirmed, and nothing new once confirmed", async () => {
    const s = (await subscribe(db, "reader@example.com"))!;
    expect(await confirmSubscriber(db, s.id, "x".repeat(43), new Date())).toBeNull();
    expect((await confirmSubscriber(db, s.id, tokenFor("confirm", s), new Date()))?.confirmedAt).toBeInstanceOf(Date);
    expect(await confirmedSubscribers(db)).toHaveLength(1);
    expect(await subscribe(db, "reader@example.com")).toBeNull();
  });

  it("deletes the address on unsubscribe", async () => {
    const s = (await subscribe(db, "reader@example.com"))!;
    await confirmSubscriber(db, s.id, tokenFor("confirm", s), new Date());
    expect(await unsubscribe(db, s.id, tokenFor("confirm", s))).toBe(false);
    expect(await unsubscribe(db, s.id, tokenFor("unsubscribe", s))).toBe(true);
    expect(await confirmedSubscribers(db)).toHaveLength(0);
    expect(await unsubscribe(db, s.id, tokenFor("unsubscribe", s))).toBe(false);
  });
});
