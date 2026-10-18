import { z } from "zod";
import { getDb } from "@/db/client";
import type { FactWithSources } from "@/db/schema";
import { getFact } from "./queries";

const factIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/** Resolves a permalink segment such as "11" to its fact, or null. */
export function factFromParam(id: string): FactWithSources | null {
  if (!/^\d+$/.test(id)) return null;
  const parsed = factIdSchema.safeParse(id);
  return parsed.success ? getFact(getDb(), parsed.data) : null;
}
