import type { Metadata } from "next";
import { tokenParamsSchema } from "@/lib/subscriptions";
import { ConfirmForm } from "../forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false } };

// Confirmation needs a button press, not just a visit, so link scanners in mail systems cannot confirm on a user's behalf.
export default async function ConfirmPage({ searchParams }: PageProps<"/subscribe/confirm">) {
  const params = await searchParams;
  const parsed = tokenParamsSchema.safeParse({ id: params.id, token: params.token });

  return (
    <div className="max-w-2xl">
      <p className="meta mb-4 text-muted">Daily email</p>
      <h1 className="font-serif text-lead">Confirm the subscription.</h1>
      {parsed.success ? (
        <ConfirmForm id={String(parsed.data.id)} token={parsed.data.token} />
      ) : (
        <p role="alert" className="meta mt-6 text-stamp">
          This link is incomplete. Copy the whole address from the email.
        </p>
      )}
    </div>
  );
}
