import type { Alert } from "../state/types";
import { BAD, FONT_DISPLAY, GOOD, MUTE, PAPER, RULE, WARN } from "../theme";

/* The log mirroring WhatsApp. Observation first, recommendation second —
   what the system SAW, then what to do. Never a conclusion. */
export default function Alerts({ alerts }: { alerts: Alert[] }) {
  return (
    <div
      style={{
        background: PAPER,
        border: "1px solid " + RULE,
        borderRadius: 6,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 14.5, fontWeight: 800, fontFamily: FONT_DISPLAY }}>
        Alerts
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: MUTE,
          marginTop: 3,
          marginBottom: 10,
        }}
      >
        Everything the system noticed. The same messages go out on WhatsApp.
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: MUTE }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#555" }}>
            Nothing to report
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Alerts appear here the moment the system spots something.
          </div>
        </div>
      ) : (
        alerts.map((a) => {
          const tone =
            a.severity === "critical"
              ? BAD
              : a.severity === "warn"
              ? WARN
              : GOOD;
          return (
            <div
              key={a.id}
              style={{
                display: "flex",
                gap: 14,
                padding: "14px 0",
                borderBottom: "1px solid " + RULE,
              }}
            >
              <div
                style={{
                  width: 4,
                  borderRadius: 2,
                  background: tone,
                  flexShrink: 0,
                  alignSelf: "stretch",
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>
                  {label(a.kind)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#333",
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {a.observation}
                </div>
                {a.recommendation && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#555",
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {a.recommendation}
                  </div>
                )}
                <div style={{ fontSize: 11, color: MUTE, marginTop: 4 }}>
                  Sent on WhatsApp to the owner and the operator
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function label(kind: Alert["kind"]): string {
  switch (kind) {
    case "low_fuel":
      return "Fuel low";
    case "order_placed":
      return "Order placed";
    case "delivery":
      return "Delivery detected";
    case "short_delivery":
      return "Short delivery";
    case "anomaly":
      return "Fuel movement, factory closed";
  }
}
