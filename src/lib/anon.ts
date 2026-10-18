import { cookies } from "next/headers";
import { z } from "zod";

const COOKIE = "pt_anon";
const anonIdSchema = z.uuid();

/** Reads the anonymous ID, if the visitor has one. Usable in Server Components. */
export async function readAnonId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const parsed = anonIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Returns the anonymous ID, issuing one if needed. Server Actions and Route Handlers only. */
export async function ensureAnonId(): Promise<string> {
  const existing = await readAnonId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}
