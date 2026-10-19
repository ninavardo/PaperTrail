import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

export function databaseUrl(): string {
  return process.env.TURSO_DATABASE_URL ?? "file:./data/papertrail.db";
}

export function createDbClient(url = databaseUrl(), authToken = process.env.TURSO_AUTH_TOKEN): Client {
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  }
  return createClient({ url, authToken });
}

const client = createDbClient();

export const db = drizzle(client, { schema });

/** App entry point; same singleton as `db`. */
export function getDb(): Db {
  return db;
}

/** Fresh database for tests and one-off scripts. Caller must run migrate. */
export function openDb(url = ":memory:"): { db: Db; client: Client } {
  const local = url === ":memory:" || url.startsWith("file:");
  const c = createClient({
    url,
    authToken: local ? undefined : process.env.TURSO_AUTH_TOKEN,
  });
  return { db: drizzle(c, { schema }), client: c };
}
