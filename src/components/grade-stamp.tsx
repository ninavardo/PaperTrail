import type { Grade } from "@/db/schema";

const LABEL: Record<Grade, string> = {
  A: "Primary document",
  B: "Reputable secondary source",
  C: "Disputed",
};

export function GradeStamp({ grade, animate = false, delayMs = 0 }: { grade: Grade; animate?: boolean; delayMs?: number }) {
  return (
    <span
      className={`stamp text-small ${animate ? "stamp-down" : ""}`}
      style={animate && delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined}
      title={LABEL[grade]}
    >
      Grade {grade}
      <span className="sr-only-text">: {LABEL[grade]}</span>
    </span>
  );
}
