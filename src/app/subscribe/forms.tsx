"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmSubscription, requestSubscription, type ConfirmState, type SubscribeState } from "./actions";

export function SubscribeForm() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(requestSubscription, {
    status: "idle",
    message: null,
  });

  if (state.status === "sent") {
    return (
      <p role="status" className="meta mt-8 max-w-xl border-t border-ink pt-2">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 max-w-xl">
      <label htmlFor="email" className="meta block text-muted">
        Email address
      </label>
      <div className="mt-1 flex flex-wrap items-end gap-4">
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="field min-w-0 flex-1"
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby="subscribe-error"
        />
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Sending" : "Subscribe"}
        </button>
      </div>
      <p id="subscribe-error" role="alert" className="meta mt-3 text-stamp">
        {state.status === "error" ? state.message : null}
      </p>
    </form>
  );
}

export function ConfirmForm({ id, token }: { id: string; token: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmSubscription, { status: "idle" });

  if (state.status === "confirmed") {
    return (
      <p role="status" className="mt-6">
        Confirmed. The first entry arrives with the next daily send. <Link href="/today">Today&rsquo;s entry</Link> is
        already up.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="token" value={token} />
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Confirming" : "Confirm subscription"}
      </button>
      {state.status === "invalid" && (
        <p role="alert" className="meta mt-4 text-stamp">
          This link is not valid. It may have been used to unsubscribe, or copied incompletely.
        </p>
      )}
    </form>
  );
}
