import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { categoryQuerySchema, parseQuery, preflight, publicApi, toApiFact } from "@/lib/api";
import { searchArchive } from "@/lib/archive";

export const dynamic = "force-dynamic";

/** Verified and disputed facts, oldest first. Retired facts are not listed. */
export const GET = publicApi(async (request: NextRequest) => {
  const query = parseQuery(request, categoryQuerySchema);
  if (!query.ok) return query.response;

  const facts = (await searchArchive(getDb(), { category: query.data.category })).map((f) =>
    toApiFact(f, request.nextUrl.origin),
  );
  return Response.json({ count: facts.length, facts }, { headers: { "Cache-Control": "public, max-age=300" } });
});

export const OPTIONS = preflight;
