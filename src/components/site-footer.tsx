import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink pt-3">
      <p className="meta text-muted">Every entry carries at least one source. Grade A: primary document. Grade B: reputable secondary source. Grade C: disputed.</p>
      <p className="meta mt-2 flex gap-4">
        <Link href="/subscribe">Daily email</Link>
        <a href="/feed.xml">RSS</a>
      </p>
    </footer>
  );
}
