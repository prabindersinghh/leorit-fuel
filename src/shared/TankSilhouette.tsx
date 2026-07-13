import { CAP, INK, MUTE, RULE, WASH } from "../theme";
import { fmt } from "../theme";

/* Monochrome 2D fallback shown while the 3D bundle loads (Suspense) and
   whenever WebGL is unavailable. It is a genuinely usable gauge, not a
   spinner — a cutaway horizontal tank with the fuel bound to state. */
export default function TankSilhouette({
  level,
  loading = false,
}: {
  level: number;
  loading?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, level / CAP));
  const W = 460;
  const H = 220;
  // tank body geometry
  const tx = 60;
  const ty = 66;
  const tw = 340;
  const th = 108;
  const fuelTop = ty + th * (1 - pct);
  const clipId = "fuelclip";

  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: "6px 0 2px",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: 520, height: "auto" }}
        aria-label="Tank level"
      >
        {/* concrete slab above */}
        <rect x={20} y={30} width={W - 40} height={16} fill={INK} opacity={0.9} />
        <rect x={20} y={46} width={W - 40} height={4} fill={INK} opacity={0.25} />
        {[...Array(9)].map((_, i) => (
          <line
            key={i}
            x1={20 + ((W - 40) / 9) * i}
            y1={30}
            x2={20 + ((W - 40) / 9) * i}
            y2={46}
            stroke="#2A2E34"
            strokeWidth={1}
          />
        ))}

        <defs>
          <clipPath id={clipId}>
            <rect x={tx} y={fuelTop} width={tw} height={ty + th - fuelTop} />
          </clipPath>
        </defs>

        {/* tank shell (horizontal cylinder, cutaway look) */}
        <rect
          x={tx}
          y={ty}
          width={tw}
          height={th}
          rx={54}
          fill={WASH}
          stroke={RULE}
          strokeWidth={2}
        />
        {/* fuel */}
        <g clipPath={`url(#${clipId})`}>
          <rect x={tx} y={ty} width={tw} height={th} rx={54} fill={INK} />
        </g>
        {/* fuel surface line */}
        {pct > 0.02 && pct < 0.98 && (
          <line
            x1={tx + 6}
            y1={fuelTop}
            x2={tx + tw - 6}
            y2={fuelTop}
            stroke="#3A3F47"
            strokeWidth={1.5}
          />
        )}
        {/* rim */}
        <rect
          x={tx}
          y={ty}
          width={tw}
          height={th}
          rx={54}
          fill="none"
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.5}
        />
        {/* probe from the top */}
        <rect x={tx + tw / 2 - 2} y={ty - 22} width={4} height={th * 0.72 + 22} fill="#5A6069" />
        <rect x={tx + tw / 2 - 7} y={ty - 26} width={14} height={7} fill={INK} />

        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize={11}
          fill={MUTE}
          fontFamily="'Inter', sans-serif"
        >
          {loading ? "Loading tank model…" : `${fmt(level)} L · ${Math.round(pct * 100)}% of ${fmt(CAP)} L`}
        </text>
      </svg>
    </div>
  );
}
