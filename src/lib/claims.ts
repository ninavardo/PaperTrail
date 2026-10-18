import { inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { claims, sources } from "@/db/schema";
import { verdictSchema } from "./validation";

export const claimInputSchema = z.object({
  text: z.string().trim().min(1, "State the claim.").max(300, "Claims are limited to 300 characters."),
  verdict: verdictSchema,
  oneLineVerdict: z
    .string()
    .trim()
    .min(1, "Write the verdict.")
    .max(200, "Verdicts are limited to 200 characters."),
  sourceIds: z.array(z.number().int().positive()).min(1, "A claim requires at least one source."),
});

export type ClaimInput = z.input<typeof claimInputSchema>;

export class UnknownSourceError extends Error {}

export function createClaim(db: Db, input: ClaimInput): number {
  const claim = claimInputSchema.parse(input);
  const ids = [...new Set(claim.sourceIds)];
  const found = db.select({ id: sources.id }).from(sources).where(inArray(sources.id, ids)).all();
  if (found.length !== ids.length) {
    throw new UnknownSourceError("Every cited source must exist.");
  }
  const row = db
    .insert(claims)
    .values({ ...claim, sourceIds: ids })
    .returning({ id: claims.id })
    .get();
  return row.id;
}
