import type { ReliabilityBin } from "@/lib/calibration";

const W = 360;
const H = 280;
const M = { top: 16, right: 16, bottom: 44, left: 48 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;

const x = (confidence: number) => M.left + ((confidence - 50) / 50) * PW;
const y = (accuracy: number) => M.top + (1 - accuracy / 100) * PH;

/** Stated confidence (x) against observed accuracy (y). The diagonal is perfect calibration. */
export function ReliabilityChart({ bins }: { bins: ReliabilityBin[] }) {
  const points = bins.filter(
    (b): b is ReliabilityBin & { meanConfidence: number; accuracy: number } => b.meanConfidence !== null && b.accuracy !== null,
  );
  const mono = { fontFamily: "var(--font-mono)", fontSize: 10 } as const;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="reliability-title reliability-desc"
      className="w-full max-w-md text-ink"
    >
      <title id="reliability-title">Reliability chart</title>
      <desc id="reliability-desc">
        Stated confidence against observed accuracy. Points on the diagonal are well calibrated; points below it are overconfident. The
        table that follows lists the same values.
      </desc>

      {[0, 25, 50, 75, 100].map((a) => (
        <g key={`y${a}`}>
          <line x1={M.left} x2={M.left + PW} y1={y(a)} y2={y(a)} stroke="var(--color-rule)" strokeWidth={1} />
          <text x={M.left - 8} y={y(a) + 3} textAnchor="end" fill="var(--color-muted)" style={mono}>
            {a}%
          </text>
        </g>
      ))}
      {[50, 60, 70, 80, 90, 100].map((c) => (
        <g key={`x${c}`}>
          <line x1={x(c)} x2={x(c)} y1={M.top + PH} y2={M.top + PH + 4} stroke="currentColor" strokeWidth={1} />
          <text x={x(c)} y={M.top + PH + 16} textAnchor="middle" fill="var(--color-muted)" style={mono}>
            {c}
          </text>
        </g>
      ))}

      <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + PH} stroke="currentColor" strokeWidth={1} />
      <line x1={M.left} x2={M.left + PW} y1={M.top + PH} y2={M.top + PH} stroke="currentColor" strokeWidth={1} />
      <line x1={x(50)} y1={y(50)} x2={x(100)} y2={y(100)} stroke="var(--color-muted)" strokeWidth={1} strokeDasharray="3 3" />

      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${x(p.meanConfidence)},${y(p.accuracy)}`).join(" ")}
          fill="none"
          stroke="var(--color-stamp)"
          strokeWidth={1}
        />
      )}
      {points.map((p) => (
        <g key={p.lo}>
          <rect x={x(p.meanConfidence) - 4} y={y(p.accuracy) - 4} width={8} height={8} fill="var(--color-stamp)" />
          <text x={x(p.meanConfidence) + 7} y={y(p.accuracy) - 6} fill="currentColor" style={mono}>
            n={p.count}
          </text>
        </g>
      ))}

      <text x={M.left + PW / 2} y={H - 6} textAnchor="middle" fill="currentColor" style={mono}>
        STATED CONFIDENCE
      </text>
      <text
        x={12}
        y={M.top + PH / 2}
        textAnchor="middle"
        fill="currentColor"
        style={mono}
        transform={`rotate(-90 12 ${M.top + PH / 2})`}
      >
        ACCURACY
      </text>
    </svg>
  );
}
