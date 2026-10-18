import { beforeEach, describe, expect, it, vi } from "vitest";
import { openDb, type Db } from "@/db/client";
import { confirmedSubscribers, confirmSubscriber, subscribe, tokenFor, tokenValid, unsubscribe } from "./subscriptions";

let db: Db;

beforeEach(() => {
  vi.stubEnv("EMAIL_TOKEN_SECRET", "test-secret-0123456789");
  db = openDb(":memory:").db;
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
  it("stores one unconfirmed row per address, ignoring case", () => {
    const first = subscribe(db, "Reader@Example.com")!;
    const again = subscribe(db, "reader@example.com")!;
    expect(again.id).toBe(first.id);
    expect(first.email).toBe("reader@example.com");
    expect(confirmedSubscribers(db)).toHaveLength(0);
  });

  it("sends nothing until confirmed, and nothing new once confirmed", () => {
    const s = subscribe(db, "reader@example.com")!;
    expect(confirmSubscriber(db, s.id, "x".repeat(43), new Date())).toBeNull();
    expect(confirmSubscriber(db, s.id, tokenFor("confirm", s), new Date())?.confirmedAt).toBeInstanceOf(Date);
    expect(confirmedSubscribers(db)).toHaveLength(1);
    expect(subscribe(db, "reader@example.com")).toBeNull();
  });

  it("deletes the address on unsubscribe", () => {
    const s = subscribe(db, "reader@example.com")!;
    confirmSubscriber(db, s.id, tokenFor("confirm", s), new Date());
    expect(unsubscribe(db, s.id, tokenFor("confirm", s))).toBe(false);
    expect(unsubscribe(db, s.id, tokenFor("unsubscribe", s))).toBe(true);
    expect(confirmedSubscribers(db)).toHaveLength(0);
    expect(unsubscribe(db, s.id, tokenFor("unsubscribe", s))).toBe(false);
  });
});
