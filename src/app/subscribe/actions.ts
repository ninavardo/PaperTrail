"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { sendEmail } from "@/lib/email/provider";
import { confirmationEmail } from "@/lib/email/templates";
import { RateLimiter } from "@/lib/rate-limit";
import { confirmSubscriber, emailConfigured, emailSchema, siteUrl, subscribe, tokenParamsSchema } from "@/lib/subscriptions";

export type SubscribeState = { status: "idle" | "sent" | "error"; message: string | null };

const globalForSubscribe = globalThis as unknown as { paperTrailSubscribeLimiter?: RateLimiter };
const limiter = (globalForSubscribe.paperTrailSubscribeLimiter ??= new RateLimiter(5, 60 * 60 * 1000));

const SENT = "If that address is not already subscribed, a confirmation link is on its way. Nothing is sent until it is confirmed.";

export async function requestSubscription(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  if (!emailConfigured()) return { status: "error", message: "Email is not configured on this server." };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!limiter.hit(ip).allowed) return { status: "error", message: "Too many requests from this address. Try again later." };

  const pending = subscribe(getDb(), parsed.data);
  if (pending) await sendEmail(confirmationEmail(pending, siteUrl()));
  // The same reply either way, so the form cannot be used to test which addresses are subscribed.
  return { status: "sent", message: SENT };
}

export type ConfirmState = { status: "idle" | "confirmed" | "invalid" };

export async function confirmSubscription(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const parsed = tokenParamsSchema.safeParse({ id: formData.get("id"), token: formData.get("token") });
  if (!parsed.success || !emailConfigured()) return { status: "invalid" };
  const s = confirmSubscriber(getDb(), parsed.data.id, parsed.data.token, new Date());
  return { status: s ? "confirmed" : "invalid" };
}
