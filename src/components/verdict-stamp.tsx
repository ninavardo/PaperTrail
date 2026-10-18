import type { Verdict } from "@/db/schema";

export function VerdictStamp({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`stamp text-small ${verdict === "TRUE" ? "stamp-ledger" : ""}`}>
      <span className="sr-only-text">Verdict: </span>
      {verdict}
    </span>
  );
}
