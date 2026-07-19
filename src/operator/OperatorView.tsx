import AnimatedNumber from "../shared/AnimatedNumber";
import type { Sim } from "../state/useSimulation";
import {
  BAD,
  CAP,
  FONT_DISPLAY,
  GOOD,
  INK,
  MUTE,
  PAPER,
  REORDER,
  RULE,
  STEEL,
  WASH,
  fmt,
} from "../theme";

/* ────────────────────────────────────────────────────────────
   OPERATOR VIEW — flat, fast, one job.
   Answers exactly one question: do I call the diesel man today?
   NO three.js import anywhere in this subtree. NO quantity field.
   Demonstrates the stale-meter state — the app says "I don't know"
   rather than showing a confident number it can no longer trust.
   ──────────────────────────────────────────────────────────── */

export default function OperatorView({ sim }: { sim: Sim }) {
  const {
    level,
    daysLeft,
    status,
    statusWordText,
    ullage,
    orderByStr,
    ordered,
    placeOrder,
    burnRate,
    meterOnline,
  } = sim;

  const stale = !meterOnline;
  const pct = Math.max(0, Math.min(100, (level / CAP) * 100));

  const statusColor = stale
    ? MUTE
    : status === "critical"
    ? BAD
    : status === "low"
    ? "#B57A10"
    : GOOD;
  const statusText = stale ? "Reading not live" : statusWordText;

  return (
    <div
      style={{
        maxWidth: 470,
        margin: "0 auto",
        padding: "clamp(18px, 5vw, 30px) clamp(12px, 4vw, 18px)",
      }}
    >
      <p
        style={{
          textAlign: "center",
          color: MUTE,
          fontSize: 12,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          margin: "0 0 18px",
          fontWeight: 700,
        }}
      >
        Diesel in the tank
      </p>

      <div
        style={{
          background: PAPER,
          border: "1px solid " + RULE,
          borderTop: "4px solid " + statusColor,
          borderRadius: 6,
          padding: "30px 24px 26px",
          textAlign: "center",
          transition: "border-color .3s",
        }}
      >
        {/* the hero number */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            // 78px on desktop (unchanged), scales down on narrow phones
            fontSize: "clamp(52px, 17vw, 78px)",
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
            color: stale ? "#B8BCC2" : INK,
            transition: "color .3s",
          }}
        >
          <AnimatedNumber value={level} duration={stale ? 0 : 520} />
        </div>
        <div
          style={{ fontSize: 15, color: MUTE, marginTop: 4, fontWeight: 600 }}
        >
          litres
        </div>

        {/* honest staleness banner — never show a stale number as if live */}
        {stale && (
          <div
            style={{
              marginTop: 14,
              background: WASH,
              border: "1px solid " + RULE,
              borderRadius: 5,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              color: "#555",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: MUTE,
                display: "inline-block",
              }}
            />
            Last reading 4 hours ago — meter offline
          </div>
        )}

        {/* tank gauge */}
        <div style={{ margin: "22px 0 8px", opacity: stale ? 0.45 : 1 }}>
          <div
            style={{
              height: 26,
              background: WASH,
              border: "1px solid " + RULE,
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: pct + "%",
                height: "100%",
                background: stale ? STEEL : INK,
                transition: "width .5s ease, background .3s",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (REORDER / CAP) * 100 + "%",
                top: 0,
                bottom: 0,
                width: 2,
                background: "#B57A10",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10.5,
              color: MUTE,
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            <span>Empty</span>
            <span>Reorder line</span>
            <span>{fmt(CAP)} L full</span>
          </div>
        </div>

        {!stale && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: statusColor,
              color: "#fff",
              padding: "7px 16px",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              marginTop: 12,
              letterSpacing: 0.5,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#fff",
                display: "inline-block",
              }}
            />
            {statusText}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 12,
          flexWrap: "wrap", // both tiles keep a readable width on small phones
        }}
      >
        <Stat
          label="Days of fuel left"
          value={stale ? "—" : String(daysLeft)}
          sub={stale ? "waiting for the meter" : "at your current use"}
        />
        <Stat
          label="Used per day"
          value={stale ? "—" : fmt(burnRate) + " L"}
          sub="last 7 working days"
        />
      </div>

      <div
        style={{
          background: PAPER,
          border: "1px solid " + RULE,
          borderRadius: 6,
          padding: 16,
          marginTop: 12,
          opacity: stale ? 0.5 : 1,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: MUTE,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          When to order
        </div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            marginTop: 6,
            fontFamily: FONT_DISPLAY,
          }}
        >
          {stale
            ? "Waiting for a live reading"
            : status === "ok"
            ? "No action needed yet"
            : `Order by ${orderByStr}`}
        </div>
        <div style={{ fontSize: 13.5, color: "#555", marginTop: 4 }}>
          The tank can take{" "}
          <strong style={{ color: INK }} className="tnum">
            {fmt(ullage)} litres
          </strong>{" "}
          right now.
        </div>
      </div>

      {ordered ? (
        <div
          style={{
            marginTop: 14,
            background: PAPER,
            border: "2px solid " + GOOD,
            borderRadius: 6,
            padding: "18px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: GOOD }}>
            Order placed
          </div>
          <div style={{ fontSize: 13, color: "#444", marginTop: 5 }}>
            <span className="tnum">{fmt(ullage)}</span> litres requested from
            Sandhu Fuels.
            <br />
            They usually deliver within 48 hours.
          </div>
        </div>
      ) : (
        <button
          onClick={placeOrder}
          disabled={status === "ok" || stale}
          style={{
            marginTop: 14,
            width: "100%",
            background: status === "ok" || stale ? "#C9CCD1" : INK,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "20px 0",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 1.6,
            cursor: status === "ok" || stale ? "not-allowed" : "pointer",
            fontFamily: FONT_DISPLAY,
          }}
        >
          ORDER DIESEL
        </button>
      )}
      <p
        style={{
          textAlign: "center",
          color: MUTE,
          fontSize: 11.5,
          marginTop: 9,
        }}
      >
        {stale
          ? "The order button returns when the meter is back and the number is live."
          : status === "ok"
          ? "The button switches on when fuel runs low."
          : "One tap. The order goes to your supplier."}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 130px", // wraps to full width only when truly cramped
        minWidth: 130,
        background: PAPER,
        border: "1px solid " + RULE,
        borderRadius: 6,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: MUTE,
          fontWeight: 700,
          letterSpacing: 0.9,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 27,
          fontWeight: 700,
          marginTop: 5,
          fontFamily: FONT_DISPLAY,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: MUTE, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
