import { GOOD, BAD, STEEL, WARN } from "../theme";

interface Props {
  skipDays: (n: number) => void;
  tankerArrives: () => void;
  meterOffline: () => void;
  nightTheft: () => void;
  reset: () => void;
}

/* The demo control bar. The disclaimer on the right STAYS exactly where it
   is — honesty is a product feature and the demo will not undercut it. */
export default function DemoBar({
  skipDays,
  tankerArrives,
  meterOffline,
  nightTheft,
  reset,
}: Props) {
  const btn = (bg: string, br?: string): React.CSSProperties => ({
    background: bg,
    color: "#fff",
    border: "1px solid " + (br || bg),
    borderRadius: 4,
    padding: "9px 15px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.2,
  });

  return (
    <div
      className="demobar safe-bottom"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#0A0B0D",
        borderTop: "1px solid #2E3238",
        // lifts the bar off the content so it is never mistaken for page end
        boxShadow: "0 -10px 28px rgba(0,0,0,.30)",
        paddingTop: 12,
        paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 80,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          color: "#6E7278",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          marginRight: 4,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Demo controls
      </span>
      {/* on narrow phones these scroll sideways together, keeping full tap size */}
      <div className="demobar-scroll" style={{ display: "contents" }}>
        <button onClick={() => skipDays(3)} style={btn(STEEL)}>
          Skip 3 days
        </button>
        <button onClick={tankerArrives} style={btn(GOOD)}>
          Tanker arrives
        </button>
        <button onClick={meterOffline} style={btn(WARN)}>
          Meter offline
        </button>
        <button onClick={nightTheft} style={btn(BAD)}>
          Fuel taken at night
        </button>
        <button onClick={reset} style={btn("transparent", "#3A3F47")}>
          Reset
        </button>
      </div>
      {/* The disclaimer STAYS on every screen size. On desktop it sits at the
          far right of the row; on mobile it drops to its own full-width line
          beneath the controls. It is never hidden and never truncated. */}
      <span
        className="demobar-note"
        style={{
          marginLeft: "auto",
          color: "#6E7278",
          fontSize: 11,
          lineHeight: 1.35,
        }}
      >
        Simulated data. Nothing here is connected to a live tank.
      </span>
    </div>
  );
}
