import Link from "next/link";

export const NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/today", label: "Today" },
  { href: "/review", label: "Review" },
  { href: "/me", label: "Calibration" },
  { href: "/court", label: "Court" },
  { href: "/archive", label: "Archive" },
];

export function SiteHeader() {
  return (
    <header className="double-rule pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <Link href="/" className="no-underline">
          <span className="font-serif text-lead font-semibold tracking-tight">Paper Trail</span>
        </Link>
        <p className="meta text-muted">Ledger of sourced facts. Money, markets, economics.</p>
      </div>
      {NAV.length > 0 && (
        <nav aria-label="Primary" className="mt-3 border-t border-rule pt-2">
          <ul className="meta flex flex-wrap gap-x-6 gap-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="no-underline hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
