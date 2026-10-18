import type { Grade } from "@/db/schema";
import { GradeStamp } from "./grade-stamp";
import { SourceList, type SourceItem } from "./source-list";

export function FactMarginalia({
  year,
  category,
  grade,
  sources,
  animateStamp = false,
  stampDelayMs = 0,
}: {
  year: number;
  category: string;
  grade: Grade;
  sources: SourceItem[];
  animateStamp?: boolean;
  stampDelayMs?: number;
}) {
  return (
    <aside className="marginalia" aria-label="Entry details">
      <dl className="meta grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted">Year</dt>
        <dd>{year}</dd>
        <dt className="text-muted">Filed</dt>
        <dd>{category}</dd>
      </dl>
      <div className="my-5">
        <GradeStamp grade={grade} animate={animateStamp} delayMs={stampDelayMs} />
      </div>
      <h2 className="meta mb-2 text-muted">Sources ({sources.length})</h2>
      <SourceList sources={sources} />
    </aside>
  );
}
