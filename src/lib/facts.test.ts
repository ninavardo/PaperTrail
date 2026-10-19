import { beforeEach, describe, expect, it } from "vitest";
import type { Client } from "@libsql/client";
import { openDb, type Db } from "@/db/client";
import { migrate } from "@/db/migrate";
import { SEED_FACTS } from "@/db/seed-data";
import { createFact } from "./facts";
import { MAX_QUOTE_WORDS, wordCount } from "./validation";

const source = { url: "https://example.org/doc", publisher: "Example Archive", quote: "A short quote." };
const fact = { sentence: "A sourced sentence.", category: "money", year: 1900, grade: "A" as const, sources: [source] };

let db: Db;
let client: Client;

beforeEach(async () => {
  ({ db, client } = openDb(":memory:"));
  await migrate(client);
});

describe("a fact requires a source", () => {
  it("rejects zero sources in code", async () => {
    await expect(createFact(db, { ...fact, sources: [] })).rejects.toThrow(/at least one source/);
  });

  it("rejects a sourceless fact in the database", async () => {
    await expect(
      client.execute("INSERT INTO facts (sentence, category, year, grade) VALUES ('x', 'money', 1900, 'A')"),
    ).rejects.toThrow(/requires at least one source/);
  });

  it("refuses to delete a fact's last source", async () => {
    const id = await createFact(db, fact);
    await expect(client.execute({ sql: "DELETE FROM sources WHERE fact_id = ?", args: [id] })).rejects.toThrow(
      /last source/,
    );
  });

  it("refuses to move a fact's last source to another fact", async () => {
    const a = await createFact(db, fact);
    const b = await createFact(db, fact);
    await expect(
      client.execute({ sql: "UPDATE sources SET fact_id = ? WHERE fact_id = ?", args: [b, a] }),
    ).rejects.toThrow(/last source/);
  });

  it("allows removing one of several sources", async () => {
    const id = await createFact(db, { ...fact, sources: [source, { ...source, url: "https://example.org/other" }] });
    await client.execute({
      sql: "DELETE FROM sources WHERE fact_id = ? AND url = 'https://example.org/other'",
      args: [id],
    });
    const count = await client.execute({ sql: "SELECT COUNT(*) AS n FROM sources WHERE fact_id = ?", args: [id] });
    expect(Number(count.rows[0].n)).toBe(1);
  });

  it("deletes sources with their fact", async () => {
    const id = await createFact(db, fact);
    await client.execute({ sql: "DELETE FROM facts WHERE id = ?", args: [id] });
    const count = await client.execute("SELECT COUNT(*) AS n FROM sources");
    expect(Number(count.rows[0].n)).toBe(0);
  });
});

describe("length limits", () => {
  it("rejects sentences over 200 characters in code and in the database", async () => {
    await expect(createFact(db, { ...fact, sentence: "a".repeat(201) })).rejects.toThrow(/200 characters/);
    const id = await createFact(db, fact);
    await expect(
      client.execute({ sql: "UPDATE facts SET sentence = ? WHERE id = ?", args: ["a".repeat(201), id] }),
    ).rejects.toThrow(/CHECK/);
  });

  it("rejects quotes over 25 words in code and in the database", async () => {
    const long = Array(26).fill("word").join(" ");
    await expect(createFact(db, { ...fact, sources: [{ ...source, quote: long }] })).rejects.toThrow(/25 words/);
    const id = await createFact(db, fact);
    await expect(
      client.execute({
        sql: "INSERT INTO sources (fact_id, url, publisher, quote) VALUES (?, 'https://e.org', 'p', ?)",
        args: [id, long],
      }),
    ).rejects.toThrow(/CHECK/);
  });
});

describe("seed data", () => {
  it("has 40 facts, each with a source and an archived copy", () => {
    expect(SEED_FACTS).toHaveLength(40);
    for (const f of SEED_FACTS) {
      expect(f.sources.length).toBeGreaterThan(0);
      for (const s of f.sources) {
        expect(wordCount(s.quote)).toBeLessThanOrEqual(MAX_QUOTE_WORDS);
        expect(s.archiveUrl).toMatch(/^https:\/\/web\.archive\.org\/web\/\d{14}\//);
      }
    }
  });

  it("loads into the database without violating any constraint", async () => {
    for (const f of SEED_FACTS) await createFact(db, f);
    const count = await client.execute("SELECT COUNT(*) AS n FROM facts");
    expect(Number(count.rows[0].n)).toBe(40);
  });
});
