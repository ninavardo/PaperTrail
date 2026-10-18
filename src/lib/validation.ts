import { z } from "zod";
import { GRADES, STATUSES, VERDICTS } from "@/db/schema";

export const MAX_SENTENCE_CHARS = 200;
export const MAX_QUOTE_WORDS = 25;

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

const collapseWhitespace = (s: string) => s.trim().replace(/\s+/g, " ");

const httpUrl = z
  .url({ protocol: /^https?$/ })
  .max(2048);

export const categorySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z-]{0,39}$/, "Category must be lowercase letters and hyphens.");

export const sourceInputSchema = z.object({
  url: httpUrl,
  archiveUrl: httpUrl.nullable().default(null),
  publisher: z.string().trim().min(1).max(120),
  quote: z
    .string()
    .transform(collapseWhitespace)
    .refine((q) => q.length > 0, "A quote is required.")
    .refine((q) => wordCount(q) <= MAX_QUOTE_WORDS, `A quote may not exceed ${MAX_QUOTE_WORDS} words.`),
});

export const factInputSchema = z.object({
  sentence: z
    .string()
    .transform(collapseWhitespace)
    .refine((s) => s.length > 0, "A sentence is required.")
    .refine((s) => s.length <= MAX_SENTENCE_CHARS, `A fact may not exceed ${MAX_SENTENCE_CHARS} characters.`),
  category: categorySchema,
  year: z.number().int().min(-3000).max(2100),
  grade: z.enum(GRADES),
  status: z.enum(STATUSES).default("verified"),
  sources: z.array(sourceInputSchema).min(1, "A fact requires at least one source."),
});

export type SourceInput = z.input<typeof sourceInputSchema>;
export type FactInput = z.input<typeof factInputSchema>;

export const verdictSchema = z.enum(VERDICTS, { error: "Choose a verdict." });
