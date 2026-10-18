import { describe, expect, it } from "vitest";
import { openDb } from "@/db/client";
import { createFact } from "./facts";
import { factLinks, factsRecovered, factsToDispute, isDead, markDisputed, recordResults, softNotFound } from "./link-check";
import { getFact } from "./queries";

describe("isDead", () => {
  it("treats missing pages, server errors and no response as dead", () => {
    for (const s of [null, 404, 410, 451, 500, 503]) expect(isDead(s)).toBe(true);
  });

  it("treats success, redirects and bot refusals as alive", () => {
    for (const s of [200, 204, 301, 401, 403, 429]) expect(isDead(s)).toBe(false);
  });
});

describe("softNotFound", () => {
  it("catches redirects to a not-found page", () => {
    expect(softNotFound("https://x.org/essays/gone", "https://x.org/not-found", true)).toBe(true);
    expect(softNotFound("https://x.org/a", "https://x.org/errors/404.html", true)).toBe(true);
  });

  it("leaves ordinary redirects and direct hits alone", () => {
    expect(softNotFound("http://x.org/a", "https://www.x.org/a/", true)).toBe(false);
    expect(softNotFound("https://x.org/a", "https://x.org/b", true)).toBe(false);
    expect(softNotFound("https://x.org/errors/404", "https://x.org/errors/404", false)).toBe(false);
  });
});

describe("factsToDispute", () => {
  it("disputes a verified fact only when every source is dead", () => {
    expect(
      factsToDispute([
        { factId: 1, status: "verified", sources: [404, null] },
        { factId: 2, status: "verified", sources: [404, 200] },
        { factId: 3, status: "verified", sources: [404, "unchecked"] },
        { factId: 4, status: "retired", sources: [404] },
        { factId: 5, status: "disputed", sources: [404] },
      ]),
    ).toEqual([1]);
  });

  it("reports disputed facts that have a live source again", () => {
    expect(
      factsRecovered([
        { factId: 1, status: "disputed", sources: [404, 200] },
        { factId: 2, status: "disputed", sources: [404, "unchecked"] },
        { factId: 3, status: "verified", sources: [200] },
      ]),
    ).toEqual([1]);
  });
});

describe("recording results", () => {
  it("stores status and time, then flags the fact whose sources are all dead", () => {
    const { db } = openDb(":memory:");
    const base = { category: "money", year: 1900, grade: "B" as const };
    const a = createFact(db, { ...base, sentence: "A.", sources: [{ url: "https://a.example/1", publisher: "A", quote: "a" }] });
    const b = createFact(db, {
      ...base,
      sentence: "B.",
      sources: [
        { url: "https://b.example/1", publisher: "B", quote: "b" },
        { url: "https://b.example/2", publisher: "B", quote: "b" },
      ],
    });
    const [sa] = getFact(db, a)!.sources;
    const [sb1, sb2] = getFact(db, b)!.sources;
    const at = new Date("2026-10-18T03:00:00Z");

    recordResults(db, [
      { sourceId: sa.id, status: 404 },
      { sourceId: sb1.id, status: null },
      { sourceId: sb2.id, status: 200 },
    ], at);
    const disputed = factsToDispute(factLinks(db));
    markDisputed(db, disputed);

    expect(disputed).toEqual([a]);
    expect(getFact(db, a)!.status).toBe("disputed");
    expect(getFact(db, b)!.status).toBe("verified");
    expect(getFact(db, a)!.sources[0]).toMatchObject({ lastStatusCode: 404, lastCheckedAt: at });
  });
});
