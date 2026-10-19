import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { SourceList } from "@/components/source-list";
import { VerdictStamp } from "@/components/verdict-stamp";
import { listClaims, type ClaimWithSources } from "@/lib/court";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Court of Claims" };

export default async function CourtPage() {
  const claims = await listClaims(getDb());
  const counts = {
    TRUE: claims.filter((c) => c.verdict === "TRUE").length,
    FALSE: claims.filter((c) => c.verdict === "FALSE").length,
    MISLEADING: claims.filter((c) => c.verdict === "MISLEADING").length,
  };

  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">Court of Claims</p>
        <h1 className="font-serif text-fact">Claims in circulation, ruled on the record.</h1>
        <p className="mt-3 max-w-xl text-muted">
          Each ruling cites sources already held in the ledger. A claim without a cited source is not heard.
        </p>

        {claims.length === 0 ? (
          <p className="mt-12 text-muted">No claims have been heard.</p>
        ) : (
          <ol className="mt-12 space-y-12">
            {claims.map((c) => (
              <ClaimEntry key={c.id} claim={c} />
            ))}
          </ol>
        )}
      </article>

      <aside className="marginalia" aria-label="Docket">
        <dl className="meta grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
          <dt className="text-muted">Claims</dt>
          <dd className="text-right">{claims.length}</dd>
          <dt className="text-muted">True</dt>
          <dd className="text-right">{counts.TRUE}</dd>
          <dt className="text-muted">False</dt>
          <dd className="text-right">{counts.FALSE}</dd>
          <dt className="text-muted">Misleading</dt>
          <dd className="text-right">{counts.MISLEADING}</dd>
        </dl>
      </aside>
    </div>
  );
}

function ClaimEntry({ claim }: { claim: ClaimWithSources }) {
  const headingId = `claim-${claim.id}`;
  return (
    <li id={headingId} className="border-t border-ink pt-4" aria-labelledby={`${headingId}-text`}>
      <p className="meta text-muted">Claim {String(claim.id).padStart(3, "0")}</p>
      <h2 id={`${headingId}-text`} className="mt-2 font-serif text-lead">
        &ldquo;{claim.text}&rdquo;
      </h2>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <VerdictStamp verdict={claim.verdict} />
        <p className="font-serif">{claim.oneLineVerdict}</p>
      </div>
      <h3 className="meta mt-6 mb-2 text-muted">Sources ({claim.sources.length})</h3>
      <SourceList sources={claim.sources} />
    </li>
  );
}
