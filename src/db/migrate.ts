import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import type { Client } from "@libsql/client";
import { createDbClient, databaseUrl } from "./client";
import { sql as init } from "./migrations/0001_init";

const MIGRATIONS: ReadonlyArray<{ id: string; sql: string }> = [{ id: "0001_init", sql: init }];

export async function migrate(client: Client): Promise<void> {
  await client.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  const applied = new Set(
    (await client.execute("SELECT id FROM _migrations")).rows.map((row) => String(row.id)),
  );
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await client.executeMultiple(migration.sql);
    await client.execute({
      sql: "INSERT INTO _migrations (id) VALUES (?)",
      args: [migration.id],
    });
  }
}

async function main(): Promise<void> {
  const url = databaseUrl();
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }
  const client = createDbClient(url);
  try {
    await migrate(client);
    console.log(`Migrated ${url}`);
  } finally {
    client.close();
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
