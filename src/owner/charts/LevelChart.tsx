import type { DayRow } from "../../state/types";
import { CAP, INK, MUTE, REORDER, RULE, WARN } from "../../theme";

/* Tank level, monochrome, honest. Each jump is a delivery. No gradients,
   no library — considered SVG. Reorder line dashed in amber (a status
   colour, permitted). */
export default function LevelChart({ data }: { data: DayRow[] }) {
  const W = 980;
  const H = 200;
  const P = 34;
  const max = CAP;
  const n = Math.max(1, data.length - 1);
  const x = (i: number) => P + (i * (W - P * 2)) / n;
  const y = (v: number) => H - P + 6 - (v / max) * (H - P - 24);
  const pts = data.map((d, i) => `${x(i)},${y(d.level)}`).join(" ");
  const area = `${P},${H - P + 6} ${pts} ${x(data.length - 1)},${H - P + 6}`;
  const last = data[data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="Tank level over the last three weeks"
    >
      {[0, 2500, 5000, 7500, 10000].map((g) => (
        <g key={g}>
          <line
            x1={P}
            y1={y(g)}
            x2={W - P}
            y2={y(g)}
            stroke={RULE}
            strokeWidth={1}
          />
          <text x={4} y={y(g) + 4} fontSize={10} fill={MUTE}>
            {g / 1000}k
          </text>
        </g>
      ))}

      <line
        x1={P}
        y1={y(REORDER)}
        x2={W - P}
        y2={y(REORDER)}
        stroke={WARN}
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <text
        x={W - P - 78}
        y={y(REORDER) - 6}
        fontSize={10}
        fill={WARN}
        fontWeight={700}
      >
        REORDER LINE
      </text>

      <polygon points={area} fill={INK} opacity={0.06} />
      <polyline
        points={pts}
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {data.map((d, i) =>
        i % 3 === 0 || i === data.length - 1 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            fontSize={9.5}
            fill={MUTE}
            textAnchor="middle"
          >
            {d.label}
          </text>
        ) : null
      )}
      {last && (
        <circle cx={x(data.length - 1)} cy={y(last.level)} r={4.5} fill={INK} />
      )}
    </svg>
  );
}
