import { beforeEach, describe, expect, it } from "vitest";
import { openDb, type Db } from "@/db/client";
import { SEED_FACTS } from "@/db/seed-data";
import { createFact } from "./facts";
import { MAX_QUOTE_WORDS, wordCount } from "./validation";
import type Database from "better-sqlite3";

const source = { url: "https://example.org/doc", publisher: "Example Archive", quote: "A short quote." };
const fact = { sentence: "A sourced sentence.", category: "money", year: 1900, grade: "A" as const, sources: [source] };

let db: Db;
let sqlite: Database.Database;

beforeEach(() => {
  ({ db, sqlite } = openDb(":memory:"));
});

describe("a fact requires a source", () => {
  it("rejects zero sources in code", () => {
    expect(() => createFact(db, { ...fact, sources: [] })).toThrow(/at least one source/);
  });

  it("rejects a sourceless fact in the database", () => {
    expect(() =>
      sqlite.prepare("INSERT INTO facts (sentence, category, year, grade) VALUES ('x', 'money', 1900, 'A')").run(),
    ).toThrow(/requires at least one source/);
  });

  it("refuses to delete a fact's last source", () => {
    const id = createFact(db, fact);
    expect(() => sqlite.prepare("DELETE FROM sources WHERE fact_id = ?").run(id)).toThrow(/last source/);
  });

  it("refuses to move a fact's last source to another fact", () => {
    const a = createFact(db, fact);
    const b = createFact(db, fact);
    expect(() => sqlite.prepare("UPDATE sources SET fact_id = ? WHERE fact_id = ?").run(b, a)).toThrow(/last source/);
  });

  it("allows removing one of several sources", () => {
    const id = createFact(db, { ...fact, sources: [source, { ...source, url: "https://example.org/other" }] });
    sqlite.prepare("DELETE FROM sources WHERE fact_id = ? AND url = 'https://example.org/other'").run(id);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM sources WHERE fact_id = ?").get(id)).toEqual({ n: 1 });
  });

  it("deletes sources with their fact", () => {
    const id = createFact(db, fact);
    sqlite.prepare("DELETE FROM facts WHERE id = ?").run(id);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM sources").get()).toEqual({ n: 0 });
  });
});

describe("length limits", () => {
  it("rejects sentences over 200 characters in code and in the database", () => {
    expect(() => createFact(db, { ...fact, sentence: "a".repeat(201) })).toThrow(/200 characters/);
    const id = createFact(db, fact);
    expect(() => sqlite.prepare("UPDATE facts SET sentence = ? WHERE id = ?").run("a".repeat(201), id)).toThrow(/CHECK/);
  });

  it("rejects quotes over 25 words in code and in the database", () => {
    const long = Array(26).fill("word").join(" ");
    expect(() => createFact(db, { ...fact, sources: [{ ...source, quote: long }] })).toThrow(/25 words/);
    const id = createFact(db, fact);
    expect(() =>
      sqlite.prepare("INSERT INTO sources (fact_id, url, publisher, quote) VALUES (?, 'https://e.org', 'p', ?)").run(id, long),
    ).toThrow(/CHECK/);
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

  it("loads into the database without violating any constraint", () => {
    for (const f of SEED_FACTS) createFact(db, f);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM facts").get()).toEqual({ n: 40 });
  });
});
