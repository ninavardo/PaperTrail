import type Database from "better-sqlite3";
import { sql as init } from "./migrations/0001_init";

const MIGRATIONS: ReadonlyArray<{ id: string; sql: string }> = [{ id: "0001_init", sql: init }];

export function migrate(sqlite: Database.Database): void {
  sqlite.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  const applied = new Set(
    sqlite
      .prepare("SELECT id FROM _migrations")
      .all()
      .map((row) => (row as { id: string }).id),
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    sqlite.transaction(() => {
      sqlite.exec(migration.sql);
      sqlite.prepare("INSERT INTO _migrations (id) VALUES (?)").run(migration.id);
    })();
  }
}
