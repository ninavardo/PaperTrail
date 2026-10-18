"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { VERDICTS } from "@/db/schema";
import type { CitableSource } from "@/lib/court";
import { addClaim, logIn, type FormState } from "./actions";

const EMPTY: FormState = { error: null, saved: null };

function FormError({ id, message }: { id: string; message: string | null }) {
  return (
    <p id={id} role="alert" className="meta mt-4 text-stamp">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(logIn, EMPTY);
  return (
    <form action={action} className="mt-8" aria-describedby="login-error">
      <label htmlFor="password" className="meta block text-muted">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="field mt-1 w-full"
        aria-invalid={state.error ? true : undefined}
      />
      <button type="submit" className="btn mt-6" disabled={pending}>
        {pending ? "Checking" : "Log in"}
      </button>
      <FormError id="login-error" message={state.error} />
    </form>
  );
}

export function ClaimForm({ sources }: { sources: CitableSource[] }) {
  const [state, action, pending] = useActionState(addClaim, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved !== null) formRef.current?.reset();
  }, [state.saved]);

  // Dispatching manually skips React's automatic form reset, so a rejected claim keeps its input.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="mt-8 space-y-8" aria-describedby="claim-status">
      <div>
        <label htmlFor="text" className="meta block text-muted">
          Claim, as it circulates
        </label>
        <textarea id="text" name="text" required maxLength={300} rows={3} className="field mt-1 w-full font-serif" />
      </div>

      <fieldset>
        <legend className="meta text-muted">Verdict</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {VERDICTS.map((v) => (
            <label key={v} className="meta flex items-center gap-2">
              <input type="radio" name="verdict" value={v} required />
              {v}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="oneLineVerdict" className="meta block text-muted">
          Verdict in one sentence
        </label>
        <input id="oneLineVerdict" name="oneLineVerdict" required maxLength={200} className="field mt-1 w-full font-serif" />
      </div>

      <fieldset>
        <legend className="meta text-muted">Cited sources (at least one)</legend>
        <ol className="mt-2 max-h-96 overflow-y-auto border border-rule">
          {sources.map((s) => (
            <li key={s.id} className="border-b border-rule last:border-b-0">
              <label className="flex gap-3 p-3">
                <input type="checkbox" name="sourceIds" value={s.id} className="mt-1" />
                <span className="min-w-0">
                  <span className="meta block text-muted">
                    Source {s.id} · {s.publisher} · Entry {String(s.factId).padStart(3, "0")}
                  </span>
                  <span className="block text-small">{s.factSentence}</span>
                </span>
              </label>
            </li>
          ))}
        </ol>
      </fieldset>

      <div>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Filing" : "File claim"}
        </button>
        <div id="claim-status" aria-live="polite">
          {state.error && <FormError id="claim-error" message={state.error} />}
          {state.saved !== null && (
            <p className="meta mt-4 text-ledger">
              Filed as claim {String(state.saved).padStart(3, "0")}.{" "}
              <Link href={`/court#claim-${state.saved}`}>View in court</Link>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
