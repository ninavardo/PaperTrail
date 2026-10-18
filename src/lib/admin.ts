import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "pt_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

function safeEqual(a: string, b: string): boolean {
  // Compare fixed-length digests so neither content nor length leaks through timing.
  const digest = (s: string) => createHmac("sha256", "paper-trail-compare").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function passwordMatches(candidate: string): boolean {
  const expected = adminPassword();
  return expected !== null && safeEqual(candidate, expected);
}

function sign(expiresAt: number, password: string): string {
  return createHmac("sha256", password).update(`admin:${expiresAt}`).digest("base64url");
}

/** Session tokens are signed with the password itself, so changing it ends every session. */
export function sessionToken(now: Date): string {
  const password = adminPassword();
  if (!password) throw new Error("ADMIN_PASSWORD is not set.");
  const expiresAt = Math.floor(now.getTime() / 1000) + SESSION_SECONDS;
  return `${expiresAt}.${sign(expiresAt, password)}`;
}

export function sessionValid(token: string | undefined, now: Date): boolean {
  const password = adminPassword();
  if (!password || !token) return false;
  const [expires, signature] = token.split(".");
  const expiresAt = Number(expires);
  if (!Number.isInteger(expiresAt) || !signature) return false;
  if (expiresAt * 1000 <= now.getTime()) return false;
  return safeEqual(signature, sign(expiresAt, password));
}

export async function isAdmin(): Promise<boolean> {
  return sessionValid((await cookies()).get(COOKIE)?.value, new Date());
}

/** Server Actions only. */
export async function startAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE, sessionToken(new Date()), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/court",
    maxAge: SESSION_SECONDS,
  });
}

/** Server Actions only. */
export async function endAdminSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/court" });
}
