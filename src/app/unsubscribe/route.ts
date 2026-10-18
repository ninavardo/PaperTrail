import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { emailConfigured, tokenParamsSchema, unsubscribe } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

function attempt(request: NextRequest): "done" | "invalid" {
  const parsed = tokenParamsSchema.safeParse({
    id: request.nextUrl.searchParams.get("id"),
    token: request.nextUrl.searchParams.get("token"),
  });
  if (!parsed.success || !emailConfigured()) return "invalid";
  return unsubscribe(getDb(), parsed.data.id, parsed.data.token) ? "done" : "invalid";
}

/** The link in every email: one click removes the address, then shows the result. */
export function GET(request: NextRequest) {
  const result = attempt(request);
  return NextResponse.redirect(new URL(`/unsubscribe/done?result=${result}`, request.nextUrl), 303);
}

/** RFC 8058 one-click unsubscribe, sent by mail clients that honour List-Unsubscribe-Post. */
export function POST(request: NextRequest) {
  const result = attempt(request);
  return new Response(null, { status: result === "done" ? 200 : 400 });
}
