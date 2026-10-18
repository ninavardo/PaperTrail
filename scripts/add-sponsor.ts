/**
 * Adds a sponsor for the slot on /today.
 *   npm run sponsor:add -- --name="Acme" --text="One line, at most 200 characters." \
 *     --url=https://acme.example --from=2026-11-01 --to=2026-12-01
 * Dates are UTC; the sponsor shows from --from (inclusive) until --to (exclusive).
 */
import { z, ZodError } from "zod";
import { databaseFile, openDb } from "@/db/client";
import { createSponsor } from "@/lib/sponsors";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

const { db, sqlite } = openDb(databaseFile());
try {
  const sponsor = createSponsor(db, {
    name: arg("name") ?? "",
    text: arg("text") ?? "",
    url: arg("url") ?? "",
    activeFrom: arg("from") ?? "",
    activeTo: arg("to") ?? "",
  });
  console.log(
    `Added sponsor ${sponsor.id} (${sponsor.name}), active ${sponsor.activeFrom.toISOString()} to ${sponsor.activeTo.toISOString()}.`,
  );
} catch (error) {
  console.error(error instanceof ZodError ? z.prettifyError(error) : error);
  process.exitCode = 1;
} finally {
  sqlite.close();
}
