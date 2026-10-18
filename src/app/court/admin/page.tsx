import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { citableSources } from "@/lib/court";
import { logOut } from "./actions";
import { ClaimForm, LoginForm } from "./forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Court of Claims · Clerk", robots: { index: false } };

export default async function CourtAdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-serif text-lead">The clerk&rsquo;s desk is closed.</h1>
        <p className="mt-4 text-muted">Set ADMIN_PASSWORD in the environment to enable it.</p>
      </div>
    );
  }

  if (!(await isAdmin())) {
    return (
      <div className="max-w-md">
        <p className="meta mb-4 text-muted">Court of Claims · Clerk</p>
        <h1 className="font-serif text-lead">Log in to file a claim.</h1>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">Court of Claims · Clerk</p>
        <h1 className="font-serif text-lead">File a claim.</h1>
        <p className="mt-3 max-w-xl text-muted">
          Rulings may only cite sources already in the ledger. To cite something new, add it to a fact first.
        </p>
        <ClaimForm sources={citableSources(getDb())} />
      </article>
      <aside className="marginalia" aria-label="Session">
        <form action={logOut}>
          <button type="submit" className="btn">
            Log out
          </button>
        </form>
      </aside>
    </div>
  );
}
