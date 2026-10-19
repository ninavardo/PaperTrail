import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { apiError, categoryQuerySchema, parseQuery, preflight, publicApi, toApiFact } from "@/lib/api";
import { isoDay } from "@/lib/dates";
import { getDailyFact } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const GET = publicApi(async (request: NextRequest) => {
  const query = parseQuery(request, categoryQuerySchema);
  if (!query.ok) return query.response;

  const now = new Date();
  const fact = await getDailyFact(getDb(), now, query.data.category);
  if (!fact) return apiError(404, "not_found", "No verified fact in that category.");

  return Response.json(
    { date: isoDay(now), fact: toApiFact(fact, request.nextUrl.origin) },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
});

export const OPTIONS = preflight;
