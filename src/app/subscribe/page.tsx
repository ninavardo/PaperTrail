import type { Metadata } from "next";
import { SubscribeForm } from "./forms";

export const metadata: Metadata = {
  title: "Daily email",
  description: "One sourced fact about money, markets and economics, by email, once a day.",
};

export default function SubscribePage() {
  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">Daily email</p>
        <h1 className="font-serif text-fact">One entry a day, with its sources.</h1>
        <p className="mt-3 max-w-xl text-muted">
          Each morning&rsquo;s email carries the day&rsquo;s sentence, its grade and every source on file. Confirmation is
          required before anything is sent. Every email has a one-click unsubscribe link.
        </p>
        <SubscribeForm />
      </article>
      <aside className="marginalia" aria-label="Other formats">
        <h2 className="meta mb-2 text-muted">Without email</h2>
        <p className="meta">
          <a href="/feed.xml">RSS feed</a>
        </p>
      </aside>
    </div>
  );
}
