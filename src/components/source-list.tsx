export type SourceItem = { id: number; url: string; archiveUrl: string | null; publisher: string; quote: string };

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SourceList({ sources }: { sources: SourceItem[] }) {
  return (
    <ol className="space-y-4">
      {sources.map((s, i) => (
        <li key={s.id} className="border-t border-rule pt-2">
          <p className="meta text-muted">
            Source {String(i + 1).padStart(2, "0")}
          </p>
          <p className="meta mt-1">{s.publisher}</p>
          <blockquote cite={s.url} className="mt-1 font-serif text-small italic">
            &ldquo;{s.quote}&rdquo;
          </blockquote>
          <p className="meta mt-1 flex flex-wrap gap-x-3">
            <a href={s.url} rel="noopener noreferrer" target="_blank">
              {hostOf(s.url)}
              <span className="sr-only-text"> (opens in a new tab)</span>
            </a>
            {s.archiveUrl && (
              <a href={s.archiveUrl} rel="noopener noreferrer" target="_blank">
                Archived copy
                <span className="sr-only-text"> of {hostOf(s.url)} (opens in a new tab)</span>
              </a>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
