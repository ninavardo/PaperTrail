import type { Sponsor } from "@/db/schema";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Deliberately unlike an entry: mono type only, no serif, no grade, no sources,
 * set apart below the ledger behind a dashed rule and labelled before its content.
 */
export function SponsorSlot({ sponsor }: { sponsor: Sponsor }) {
  return (
    <aside aria-label="Sponsored" className="mt-16 max-w-xl border border-dashed border-muted p-4">
      <p className="meta text-muted">
        Sponsored · not an entry, not verified by Paper Trail
      </p>
      <p className="meta mt-3 normal-case tracking-normal">
        <span className="font-medium">{sponsor.name}.</span> {sponsor.text}
      </p>
      <p className="meta mt-3">
        <a href={sponsor.url} rel="sponsored noopener noreferrer" target="_blank">
          {hostOf(sponsor.url)}
          <span className="sr-only-text"> (sponsor link, opens in a new tab)</span>
        </a>
      </p>
    </aside>
  );
}
