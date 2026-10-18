import type { NextRequest } from "next/server";
import { z } from "zod";
import { GRADES, STATUSES, type FactWithSources } from "@/db/schema";
import { RateLimiter } from "./rate-limit";
import { categorySchema } from "./validation";

export const API_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

const globalForApi = globalThis as unknown as { paperTrailApiLimiter?: RateLimiter };
const limiter = (globalForApi.paperTrailApiLimiter ??= new RateLimiter(API_RATE_LIMIT.limit, API_RATE_LIMIT.windowMs));

const apiSourceSchema = z.object({
  url: z.url(),
  archiveUrl: z.url().nullable(),
  publisher: z.string(),
  quote: z.string(),
  lastCheckedAt: z.iso.datetime().nullable(),
  lastStatusCode: z.number().int().nullable(),
});

export const apiFactSchema = z.object({
  id: z.number().int().positive(),
  sentence: z.string().max(200),
  category: z.string(),
  year: z.number().int(),
  grade: z.enum(GRADES),
  status: z.enum(STATUSES),
  permalink: z.url(),
  sources: z.array(apiSourceSchema).min(1),
});

export type ApiFact = z.infer<typeof apiFactSchema>;

/** Serialises a fact and checks it against the published response schema, sources included. */
export function toApiFact(fact: FactWithSources, origin: string): ApiFact {
  return apiFactSchema.parse({
    id: fact.id,
    sentence: fact.sentence,
    category: fact.category,
    year: fact.year,
    grade: fact.grade,
    status: fact.status,
    permalink: `${origin}/archive/${fact.id}`,
    sources: fact.sources.map((s) => ({
      url: s.url,
      archiveUrl: s.archiveUrl,
      publisher: s.publisher,
      quote: s.quote,
      lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
      lastStatusCode: s.lastStatusCode,
    })),
  });
}

/** The first hop in X-Forwarded-For, as set by the hosting proxy. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After",
};

export function preflight(): Response {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } });
}

export function apiError(status: number, code: string, message: string, headers: HeadersInit = {}): Response {
  return Response.json({ error: { code, message } }, { status, headers: { ...CORS, ...headers } });
}

type Handler = (request: NextRequest) => Response | Promise<Response>;

/** Applies the per-IP rate limit and CORS headers to a public GET handler. */
export function publicApi(handler: Handler): Handler {
  return async (request) => {
    const now = Date.now();
    const rate = limiter.hit(clientIp(request), now);
    const resetSeconds = Math.max(0, Math.ceil((rate.resetAt - now) / 1000));
    const rateHeaders: Record<string, string> = {
      "RateLimit-Limit": String(rate.limit),
      "RateLimit-Remaining": String(rate.remaining),
      "RateLimit-Reset": String(resetSeconds),
    };
    if (!rate.allowed) {
      return apiError(429, "rate_limited", `Limit is ${rate.limit} requests per minute per IP.`, {
        ...rateHeaders,
        "Retry-After": String(resetSeconds),
      });
    }
    const response = await handler(request);
    for (const [k, v] of Object.entries({ ...CORS, ...rateHeaders })) response.headers.set(k, v);
    return response;
  };
}

export const categoryQuerySchema = z.object({ category: categorySchema.optional() });

/** Validates query parameters; unknown parameters are rejected so typos do not silently widen a query. */
export function parseQuery<T extends z.ZodObject>(
  request: NextRequest,
  schema: T,
): { ok: true; data: z.infer<T> } | { ok: false; response: Response } {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = schema.strict().safeParse(params);
  if (parsed.success) return { ok: true, data: parsed.data as z.infer<T> };
  const message = parsed.error.issues
    .map((i) => (i.code === "unrecognized_keys" ? `unknown parameter: ${i.keys.join(", ")}` : `${i.path.join(".")}: ${i.message}`))
    .join("; ");
  return { ok: false, response: apiError(400, "invalid_query", message) };
}
