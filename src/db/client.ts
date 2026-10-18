import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { migrate } from "./migrate";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

export function openDb(file: string): { db: Db; sqlite: Database.Database } {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  migrate(sqlite);
  return { db: drizzle(sqlite, { schema }), sqlite };
}

export function databaseFile(): string {
  // Runtime location, not a build input: keep it out of output file tracing.
  return resolve(/* turbopackIgnore: true */ process.env.DATABASE_FILE ?? "data/paper-trail.db");
}

const globalForDb = globalThis as unknown as { paperTrailDb?: Db };

export function getDb(): Db {
  if (!globalForDb.paperTrailDb) {
    globalForDb.paperTrailDb = openDb(databaseFile()).db;
  }
  return globalForDb.paperTrailDb;
}
