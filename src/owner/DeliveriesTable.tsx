import type { Delivery } from "../state/types";
import {
  BAD,
  FONT_DISPLAY,
  GOOD,
  INK,
  MUTE,
  PAPER,
  RULE,
  WASH,
  fmt,
  money,
} from "../theme";

/* ────────────────────────────────────────────────────────────
   THE MONEY SCREEN.
   The commercial argument rests here. The rupee shortfall is what
   the owner's eye lands on first. Tolerance is a VISIBLE column —
   it is the answer to "how do I know your meter isn't just wrong?"
   and it must survive a screenshot he forwards to his supplier.
   ──────────────────────────────────────────────────────────── */

const th: React.CSSProperties = {
  textAlign: "left",
  background: INK,
  color: "#fff",
  padding: "10px 12px",
  fontSize: 11,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid " + RULE,
  fontSize: 13,
  verticalAlign: "middle",
};

function StatusChip({ status }: { status: Delivery["status"] }) {
  const map = {
    short: { bg: BAD, label: "SHORT" },
    ok: { bg: GOOD, label: "OK" },
    over: { bg: MUTE, label: "OVER" },
    awaiting_invoice: { bg: "#0A0B0D", label: "AWAITING INVOICE" },
  } as const;
  const s = map[status];
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.6,
        padding: "4px 9px",
        borderRadius: 3,
        color: "#fff",
        background: s.bg,
        whiteSpace: "nowrap",
        border: status === "awaiting_invoice" ? "1px dashed #6E7278" : "none",
      }}
    >
      {s.label}
    </span>
  );
}

export default function DeliveriesTable({
  deliveries,
}: {
  deliveries: Delivery[];
}) {
  const shortTotal = deliveries
    .filter((d) => d.status === "short")
    .reduce(
      (s, d) => s + (d.varianceLitres ?? 0) * (d.ratePerLitre ?? 0),
      0
    );
  const shortLitres = deliveries
    .filter((d) => d.status === "short")
    .reduce((s, d) => s + (d.varianceLitres ?? 0), 0);
  const shortCount = deliveries.filter((d) => d.status === "short").length;

  return (
    <div
      style={{
        background: PAPER,
        border: "1px solid " + RULE,
        borderRadius: 6,
        padding: 20,
      }}
    >
      {/* the number the eye lands on first */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: MUTE,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Money paid for, never delivered
          </div>
          <div
            className="tnum"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 52,
              fontWeight: 700,
              color: BAD,
              letterSpacing: -2,
              lineHeight: 1.05,
              marginTop: 2,
            }}
          >
            {money(shortTotal)}
          </div>
          <div style={{ color: MUTE, fontSize: 13, marginTop: 2 }}>
            <span className="tnum">{fmt(shortLitres)}</span> litres invoiced but
            never delivered, across {shortCount} tankers.
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: MUTE,
          margin: "10px 0 16px",
          maxWidth: 720,
          lineHeight: 1.5,
        }}
      >
        We measure the tank before and after the truck unloads, wait for the
        fuel to settle, then compare against the invoice. The tolerance column
        is the meter's own margin of error — a shortfall is only flagged when it
        clears it.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 760,
          }}
        >
          <thead>
            <tr>
              {[
                "Tanker",
                "Date",
                "Invoiced",
                "Delivered",
                "Short by",
                "Tolerance ±",
                "Value",
                "Status",
              ].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d, i) => {
              const awaiting = d.status === "awaiting_invoice";
              const short = d.status === "short";
              const variance = d.varianceLitres ?? 0;
              return (
                <tr
                  key={d.id}
                  style={{
                    background: awaiting ? "#FBFAF3" : i % 2 ? WASH : PAPER,
                  }}
                >
                  <td style={td}>
                    <strong>{d.id}</strong>
                  </td>
                  <td style={{ ...td, color: MUTE }}>{d.dateLabel}</td>
                  <td style={{ ...td }} className="tnum">
                    {d.invoicedLitres != null ? (
                      fmt(d.invoicedLitres) + " L"
                    ) : (
                      <span style={{ color: MUTE, fontStyle: "italic" }}>
                        awaiting reply
                      </span>
                    )}
                  </td>
                  <td style={{ ...td }} className="tnum">
                    <strong>{fmt(d.actualLitres)} L</strong>
                  </td>
                  <td
                    className="tnum"
                    style={{
                      ...td,
                      color: short ? BAD : awaiting ? MUTE : GOOD,
                      fontWeight: 700,
                    }}
                  >
                    {awaiting ? "—" : variance > 0 ? fmt(variance) + " L" : "—"}
                  </td>
                  <td className="tnum" style={{ ...td, color: MUTE }}>
                    ±{fmt(d.toleranceLitres)} L
                  </td>
                  <td
                    className="tnum"
                    style={{
                      ...td,
                      color: short ? BAD : MUTE,
                      fontWeight: 700,
                    }}
                  >
                    {short ? money(variance * (d.ratePerLitre ?? 0)) : "—"}
                  </td>
                  <td style={td}>
                    <StatusChip status={d.status} />
                    {awaiting && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: MUTE,
                          marginTop: 4,
                        }}
                      >
                        reply on WhatsApp to reconcile
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 18,
          background: INK,
          color: "#fff",
          padding: "16px 18px",
          borderRadius: 5,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          className="tnum"
          style={{ fontSize: 28, fontWeight: 800, fontFamily: FONT_DISPLAY }}
        >
          {money(shortTotal)}
        </div>
        <div style={{ fontSize: 13, color: "#C9CCD1", lineHeight: 1.5 }}>
          paid for, never delivered. This is the number you take to your
          supplier.
          <br />
          Every row carries its own tolerance, so the claim is defensible.
          Without the meter, none of it is provable.
        </div>
      </div>
    </div>
  );
}
