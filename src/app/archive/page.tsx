import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { GRADES, type FactWithSources } from "@/db/schema";
import { archiveFacets, parseArchiveQuery, searchArchive } from "@/lib/archive";
import { entryNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Archive",
  description: "Every sourced entry in the Paper Trail ledger, searchable by category, year and grade.",
};

export default async function ArchivePage({ searchParams }: PageProps<"/archive">) {
  const query = parseArchiveQuery(await searchParams);
  const db = getDb();
  const facets = await archiveFacets(db);
  const results = await searchArchive(db, query);
  const filtered = Object.keys(query).length > 0;

  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">Archive</p>
        <h1 className="font-serif text-fact">The ledger, in full.</h1>

        <form method="get" action="/archive" role="search" className="mt-10 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <label className="meta flex flex-col gap-1 sm:col-span-2">
            <span className="text-muted">Search entries</span>
            <input type="search" name="q" defaultValue={query.q ?? ""} maxLength={100} className="field font-serif text-body" />
          </label>
          <label className="meta flex flex-col gap-1">
            <span className="text-muted">Category</span>
            <select name="category" defaultValue={query.category ?? ""} className="field">
              <option value="">All</option>
              {facets.categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>
          </label>
          <label className="meta flex flex-col gap-1">
            <span className="text-muted">Grade</span>
            <select name="grade" defaultValue={query.grade ?? ""} className="field">
              <option value="">All</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="meta text-muted">Year</legend>
            <div className="meta mt-1 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="sr-only-text">From year</span>
                <input
                  type="number"
                  name="from"
                  inputMode="numeric"
                  placeholder={String(facets.minYear)}
                  defaultValue={query.from ?? ""}
                  className="field w-24"
                />
              </label>
              <span aria-hidden="true">to</span>
              <label className="flex items-center gap-2">
                <span className="sr-only-text">To year</span>
                <input
                  type="number"
                  name="to"
                  inputMode="numeric"
                  placeholder={String(facets.maxYear)}
                  defaultValue={query.to ?? ""}
                  className="field w-24"
                />
              </label>
            </div>
          </fieldset>
          <div className="flex items-center gap-5 sm:col-span-2">
            <button type="submit" className="btn">
              Search
            </button>
            {filtered && (
              <Link href="/archive" className="meta">
                Clear filters
              </Link>
            )}
          </div>
        </form>

        <section aria-labelledby="results" className="mt-12">
          <h2 id="results" className="meta mb-2 border-b border-ink pb-1" aria-live="polite">
            {results.length} {results.length === 1 ? "entry" : "entries"}
          </h2>
          {results.length === 0 ? (
            <p className="mt-4 text-muted">No entries match.</p>
          ) : (
            <ol>
              {results.map((f) => (
                <ArchiveRow key={f.id} fact={f} />
              ))}
            </ol>
          )}
        </section>
      </article>

      <aside className="marginalia" aria-label="Index">
        <h2 className="meta mb-2 text-muted">Categories</h2>
        <ul className="meta space-y-1">
          {facets.categories.map((c) => (
            <li key={c.category} className="flex justify-between gap-3">
              <Link href={`/archive?category=${c.category}`}>{c.category}</Link>
              <span>{c.count}</span>
            </li>
          ))}
        </ul>
        <p className="meta mt-5 border-t border-rule pt-2 text-muted">
          Years {facets.minYear}–{facets.maxYear}. Retired entries keep their permalinks but leave the index.
        </p>
      </aside>
    </div>
  );
}

function ArchiveRow({ fact }: { fact: FactWithSources }) {
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 border-b border-rule py-3">
      <span className="meta pt-1">{fact.year}</span>
      <div>
        <Link href={`/archive/${fact.id}`} className="font-serif no-underline hover:underline">
          {fact.sentence}
        </Link>
        <p className="meta mt-1 text-muted">
          Entry {entryNumber(fact.id)} · {fact.category} · Grade {fact.grade} · {fact.sources.length}{" "}
          {fact.sources.length === 1 ? "source" : "sources"}
          {fact.status === "disputed" && <span className="text-stamp"> · Disputed</span>}
        </p>
      </div>
    </li>
  );
}
