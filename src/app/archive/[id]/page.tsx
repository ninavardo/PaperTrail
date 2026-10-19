import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FactMarginalia } from "@/components/fact-marginalia";
import { isoDay } from "@/lib/dates";
import { entryNumber } from "@/lib/format";
import { factFromParam } from "@/lib/permalink";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/archive/[id]">): Promise<Metadata> {
  const fact = await factFromParam((await params).id);
  if (!fact) return { title: "Entry not found" };
  const title = `Entry ${entryNumber(fact.id)}`;
  return {
    title,
    description: fact.sentence,
    alternates: { canonical: `/archive/${fact.id}` },
    openGraph: { type: "article", title: `${title} · Paper Trail`, description: fact.sentence },
    twitter: { card: "summary_large_image", title: `${title} · Paper Trail`, description: fact.sentence },
    robots: fact.status === "retired" ? { index: false } : undefined,
  };
}

const STATUS_NOTE = {
  disputed: "Disputed. The sources on file are under review. Read them before relying on this entry.",
  retired: "Retired. This entry has been withdrawn from the ledger and is kept here so the link does not break.",
} as const;

export default async function EntryPage({ params }: PageProps<"/archive/[id]">) {
  const fact = await factFromParam((await params).id);
  if (!fact) notFound();

  return (
    <div className="ledger">
      <article className="min-w-0">
        <p className="meta mb-4 text-muted">
          <Link href="/archive">Archive</Link> · Entry {entryNumber(fact.id)} · Filed {isoDay(fact.createdAt)}
        </p>
        <h1 className={`font-serif text-fact ${fact.status === "retired" ? "text-muted line-through decoration-1" : ""}`}>
          {fact.sentence}
        </h1>
        {fact.status !== "verified" && (
          <p className="meta mt-8 max-w-xl border-t border-stamp pt-2 text-stamp">{STATUS_NOTE[fact.status]}</p>
        )}
        <p className="meta mt-10 max-w-xl border-t border-rule pt-2 text-muted">
          Permalink: <span className="normal-case">/archive/{fact.id}</span>
        </p>
      </article>
      <FactMarginalia year={fact.year} category={fact.category} grade={fact.grade} sources={fact.sources} />
    </div>
  );
}
