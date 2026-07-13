import type { WaMessage } from "../state/types";
import { RULE } from "../theme";

/* A real WhatsApp thread, not a mockup. Correct bubble geometry with
   the tail, the ECE5DD wallpaper, a business-account header, sent ticks
   and a timestamp. In production this is a real message; it should read
   like one now. */

const WA_GREEN = "#075E54";
const WA_TICK = "#34B7F1";

function DoubleTick() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" style={{ marginLeft: 3 }}>
      <path
        d="M11.1 0.5 L5.4 8.1 L3.2 5.6 M15 0.5 L9.3 8.1 L9.0 7.8"
        fill="none"
        stroke={WA_TICK}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WhatsAppToast({
  data,
  close,
}: {
  data: WaMessage;
  close: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="WhatsApp message"
      style={{
        position: "fixed",
        right: 22,
        bottom: 96,
        width: 328,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 18px 50px rgba(0,0,0,.30)",
        border: "1px solid " + RULE,
        zIndex: 60,
        animation: "waIn .28s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <style>{`
        @keyframes waIn { from { opacity:0; transform: translateY(10px) scale(.98);} to {opacity:1; transform:none;} }
        @media (prefers-reduced-motion: reduce){ [role=dialog]{ animation: none !important; } }
      `}</style>

      {/* header */}
      <div
        style={{
          background: WA_GREEN,
          color: "#fff",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#0B7F71",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          L
        </div>
        <div style={{ lineHeight: 1.3, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Leorit Fuel</div>
          <div style={{ fontSize: 10.5, opacity: 0.82 }}>
            WhatsApp Business · online
          </div>
        </div>
        <button
          onClick={close}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            opacity: 0.85,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* thread — WhatsApp doodle wallpaper tone */}
      <div
        style={{
          background: "#ECE5DD",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          padding: "16px 12px 14px",
        }}
      >
        {/* incoming bubble (from Leorit) with the tail on the top-left */}
        <div style={{ position: "relative", maxWidth: "86%" }}>
          {/* the tail */}
          <div
            style={{
              position: "absolute",
              left: -6,
              top: 0,
              width: 0,
              height: 0,
              borderTop: "8px solid #fff",
              borderLeft: "8px solid transparent",
            }}
          />
          <div
            style={{
              background: "#fff",
              borderRadius: "0 8px 8px 8px",
              padding: "9px 11px 7px",
              fontSize: 13.4,
              lineHeight: 1.5,
              color: "#111B21",
              boxShadow: "0 1px 1px rgba(0,0,0,.10)",
            }}
          >
            {data.lines.map((l, i) => (
              <div
                key={i}
                style={{
                  marginBottom: i === data.lines.length - 1 ? 0 : 5,
                  fontWeight: i === 0 ? 700 : 400,
                }}
              >
                {l}
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                fontSize: 10.5,
                color: "#667781",
                marginTop: 4,
              }}
            >
              {data.time}
              <DoubleTick />
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 10.5,
            color: "#5B6B73",
            marginTop: 10,
            textAlign: "center",
          }}
        >
          Delivered to the owner and the operator
        </div>
      </div>
    </div>
  );
}
