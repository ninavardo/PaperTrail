import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { apiError, categoryQuerySchema, parseQuery, preflight, publicApi, toApiFact } from "@/lib/api";
import { getRandomFact } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const GET = publicApi(async (request: NextRequest) => {
  const query = parseQuery(request, categoryQuerySchema);
  if (!query.ok) return query.response;

  const fact = await getRandomFact(getDb(), query.data.category);
  if (!fact) return apiError(404, "not_found", "No verified fact in that category.");

  return Response.json({ fact: toApiFact(fact, request.nextUrl.origin) }, { headers: { "Cache-Control": "no-store" } });
});

export const OPTIONS = preflight;
