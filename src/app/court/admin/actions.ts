"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { endAdminSession, isAdmin, passwordMatches, startAdminSession } from "@/lib/admin";
import { claimInputSchema, createClaim, UnknownSourceError } from "@/lib/claims";

export type FormState = { error: string | null; saved: number | null };

const loginSchema = z.object({ password: z.string().min(1).max(500) });

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success || !passwordMatches(parsed.data.password)) {
    return { error: "Password not accepted.", saved: null };
  }
  await startAdminSession();
  redirect("/court/admin");
}

export async function logOut(): Promise<void> {
  await endAdminSession();
  redirect("/court/admin");
}

export async function addClaim(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Session expired. Log in again.", saved: null };

  const parsed = claimInputSchema.safeParse({
    text: formData.get("text"),
    verdict: formData.get("verdict"),
    oneLineVerdict: formData.get("oneLineVerdict"),
    sourceIds: formData.getAll("sourceIds").map(Number),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" "), saved: null };
  }

  try {
    const id = createClaim(getDb(), parsed.data);
    revalidatePath("/court");
    return { error: null, saved: id };
  } catch (e) {
    if (e instanceof UnknownSourceError) return { error: e.message, saved: null };
    throw e;
  }
}
