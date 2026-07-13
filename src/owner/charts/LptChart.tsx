import type { DayRow } from "../../state/types";
import { BAD, INK, MUTE, RULE } from "../../theme";

/* Litres of diesel per tonne of paint. Bars, monochrome. Days that run
   above the average are flagged in BAD (a status colour) — a second look,
   not an accusation. */
export default function LptChart({ data }: { data: DayRow[] }) {
  const W = 940;
  const H = 168;
  const P = 34;
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.lpt)) * 1.25 || 1;
  const bw = (W - P * 2) / data.length - 8;
  const avg = data.reduce((s, d) => s + d.lpt, 0) / data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="Litres of diesel per tonne of paint"
    >
      <line x1={P} y1={H - 26} x2={W - P} y2={H - 26} stroke={RULE} />
      <line
        x1={P}
        y1={H - 26 - (avg / max) * (H - 52)}
        x2={W - P}
        y2={H - 26 - (avg / max) * (H - 52)}
        stroke={MUTE}
        strokeDasharray="4 4"
      />
      <text
        x={W - P - 30}
        y={H - 30 - (avg / max) * (H - 52)}
        fontSize={9.5}
        fill={MUTE}
        fontWeight={700}
      >
        average
      </text>

      {data.map((d, i) => {
        const h = (d.lpt / max) * (H - 52);
        const X = P + i * (bw + 8);
        const high = d.lpt > avg * 1.12;
        return (
          <g key={i}>
            <rect
              x={X}
              y={H - 26 - h}
              width={bw}
              height={h}
              fill={high ? BAD : INK}
              rx={1.5}
            />
            <text
              x={X + bw / 2}
              y={H - 32 - h}
              fontSize={9.5}
              fill={high ? BAD : INK}
              textAnchor="middle"
              fontWeight={700}
            >
              {d.lpt}
            </text>
            <text
              x={X + bw / 2}
              y={H - 12}
              fontSize={9}
              fill={MUTE}
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
