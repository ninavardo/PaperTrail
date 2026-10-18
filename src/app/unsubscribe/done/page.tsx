import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false } };

export default async function UnsubscribedPage({ searchParams }: PageProps<"/unsubscribe/done">) {
  const { result } = await searchParams;
  const done = result === "done";
  return (
    <div className="max-w-2xl">
      <p className="meta mb-4 text-muted">Daily email</p>
      <h1 className="font-serif text-lead">{done ? "Unsubscribed." : "Nothing to unsubscribe."}</h1>
      <p className="mt-4">
        {done
          ? "The address has been deleted from the list. No further email will be sent."
          : "This link does not match a current subscription. The address may already have been removed."}
      </p>
      <p className="meta mt-6">
        <Link href="/today">Today&rsquo;s entry</Link>
      </p>
    </div>
  );
}
