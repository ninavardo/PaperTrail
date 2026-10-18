import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The SQL in ./migrations is the source of truth for constraints and triggers
// (deferred foreign keys and triggers are not expressible in Drizzle's DSL).
// These table definitions mirror it for typed queries.

export const GRADES = ["A", "B", "C"] as const;
export const STATUSES = ["verified", "disputed", "retired"] as const;
export const GUESS_KINDS = ["number", "truefalse"] as const;
export const VERDICTS = ["TRUE", "FALSE", "MISLEADING"] as const;

export type Grade = (typeof GRADES)[number];
export type Status = (typeof STATUSES)[number];
export type GuessKind = (typeof GUESS_KINDS)[number];
export type Verdict = (typeof VERDICTS)[number];

export const facts = sqliteTable("facts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sentence: text("sentence").notNull(),
  category: text("category").notNull(),
  year: integer("year").notNull(),
  grade: text("grade", { enum: GRADES }).notNull(),
  status: text("status", { enum: STATUSES }).notNull().default("verified"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  factId: integer("fact_id")
    .notNull()
    .references(() => facts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  archiveUrl: text("archive_url"),
  publisher: text("publisher").notNull(),
  quote: text("quote").notNull(),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  lastStatusCode: integer("last_status_code"),
});

export const guesses = sqliteTable("guesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  anonId: text("anon_id").notNull(),
  factId: integer("fact_id")
    .notNull()
    .references(() => facts.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: GUESS_KINDS }).notNull(),
  guess: real("guess").notNull(),
  truth: real("truth").notNull(),
  confidence: integer("confidence").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const claims = sqliteTable("claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  verdict: text("verdict", { enum: VERDICTS }).notNull(),
  oneLineVerdict: text("one_line_verdict").notNull(),
  sourceIds: text("source_ids", { mode: "json" }).$type<number[]>().notNull(),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
});

export const sponsors = sqliteTable("sponsors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  text: text("text").notNull(),
  url: text("url").notNull(),
  activeFrom: integer("active_from", { mode: "timestamp" }).notNull(),
  activeTo: integer("active_to", { mode: "timestamp" }).notNull(),
});

export type Fact = typeof facts.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Guess = typeof guesses.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type FactWithSources = Fact & { sources: Source[] };
