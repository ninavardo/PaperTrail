import { and, asc, gt, lte } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { sponsors, type Sponsor } from "@/db/schema";

export const sponsorInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(200),
    url: z.url({ protocol: /^https$/ }),
    activeFrom: z.coerce.date(),
    activeTo: z.coerce.date(),
  })
  .refine((s) => s.activeTo > s.activeFrom, { message: "activeTo must be after activeFrom.", path: ["activeTo"] });

export type SponsorInput = z.input<typeof sponsorInputSchema>;

export function createSponsor(db: Db, input: SponsorInput): Sponsor {
  return db.insert(sponsors).values(sponsorInputSchema.parse(input)).returning().get();
}

/** The one sponsor shown at `now`: active from activeFrom (inclusive) to activeTo (exclusive), earliest start first. */
export function activeSponsor(db: Db, now: Date): Sponsor | null {
  return (
    db
      .select()
      .from(sponsors)
      .where(and(lte(sponsors.activeFrom, now), gt(sponsors.activeTo, now)))
      .orderBy(asc(sponsors.activeFrom), asc(sponsors.id))
      .limit(1)
      .get() ?? null
  );
}
