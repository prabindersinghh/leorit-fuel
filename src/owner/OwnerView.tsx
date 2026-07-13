import { lazy, Suspense, useState } from "react";
import type { Sim } from "../state/useSimulation";
import AnimatedNumber from "../shared/AnimatedNumber";
import TankSilhouette from "../shared/TankSilhouette";
import DeliveriesTable from "./DeliveriesTable";
import CostPerTonne from "./CostPerTonne";
import Alerts from "./Alerts";
import LevelChart from "./charts/LevelChart";
import {
  BAD,
  FONT_DISPLAY,
  INK,
  MUTE,
  PAPER,
  RULE,
  WASH,
  fmt,
  money,
  statusColor,
} from "../theme";

/* the 3D scene is code-split here. three.js is NEVER imported anywhere the
   operator can reach — only inside this lazy boundary. */
const TankScene = lazy(() => import("./TankScene"));

type Tab = "overview" | "deliveries" | "cost" | "alerts";

export default function OwnerView({ sim }: { sim: Sim }) {
  const {
    level,
    history,
    deliveries,
    alerts,
    burnRate,
    daysLeft,
    litresPerTonne,
    statusWordText,
    orderByStr,
    ullage,
  } = sim;
  const [tab, setTab] = useState<Tab>("overview");

  const shortTotal = deliveries
    .filter((d) => d.status === "short")
    .reduce((s, d) => s + (d.varianceLitres ?? 0) * (d.ratePerLitre ?? 0), 0);

  const awaiting = deliveries.some((d) => d.status === "awaiting_invoice");

  const TABS: [Tab, string][] = [
    ["overview", "Overview"],
    ["deliveries", "Deliveries"],
    ["cost", "Cost per tonne"],
    ["alerts", `Alerts${alerts.length ? " (" + alerts.length + ")" : ""}`],
  ];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "22px 20px" }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid " + RULE,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              background: "none",
              border: "none",
              borderBottom: "3px solid " + (tab === k ? INK : "transparent"),
              color: tab === k ? INK : MUTE,
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: -1,
              fontFamily: FONT_DISPLAY,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* rupees lead, not litres */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 12,
            }}
          >
            <KPI
              label="Recovered from short deliveries"
              num={shortTotal}
              format={money}
              note="measured, not estimated"
              big
              accent
            />
            <KPI
              label="In the tank"
              num={level}
              format={(n) => fmt(n) + " L"}
              note={statusWordText}
              noteColor={statusColor(level)}
            />
            <KPI
              label="Days of fuel left"
              num={daysLeft}
              format={(n) => String(Math.round(n * 10) / 10)}
              note={"Order by " + orderByStr.split(",")[0]}
            />
            <KPI
              label="Diesel per tonne of paint"
              value={litresPerTonne + " L"}
              note="only Leorit can show this"
            />
          </div>

          {/* the 3D hero, below the money */}
          <Panel
            title="The tank, right now"
            sub="The diesel you see is the live level. When a tanker unloads, you watch it fill and the measured volume appears on the model."
          >
            {awaiting && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "#8A6D1B",
                  background: "#FBFAF3",
                  border: "1px solid #ECE3C4",
                  borderRadius: 5,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                A delivery has been measured and is awaiting its invoice — see
                the Deliveries tab.
              </div>
            )}
            <Suspense fallback={<TankSilhouette level={level} loading />}>
              <TankScene level={level} />
            </Suspense>
          </Panel>

          <Panel
            title="Tank level, last 3 weeks"
            sub="Each jump is a tanker delivery."
          >
            <LevelChart data={history} />
          </Panel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            <Panel
              title="Money recovered from short deliveries"
              sub="Measured, not estimated."
            >
              <div
                className="tnum"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 40,
                  fontWeight: 800,
                  color: BAD,
                  letterSpacing: -1,
                }}
              >
                {money(shortTotal)}
              </div>
              <div style={{ color: MUTE, fontSize: 13, marginTop: 4 }}>
                Litres invoiced but never delivered. Before this system, the
                invoice was the only number anyone had.
              </div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid " + RULE,
                  fontSize: 13,
                  color: "#444",
                  lineHeight: 1.5,
                }}
              >
                Open the Deliveries tab to see every tanker, its tolerance, and
                the exact figure you take to your supplier.
              </div>
            </Panel>

            <Panel
              title="Next refill"
              sub="Predicted from your real consumption."
            >
              <Row k="Order by" v={orderByStr} strong />
              <Row k="Quantity the tank can take" v={fmt(ullage) + " litres"} />
              <Row k="Used per working day" v={fmt(burnRate) + " L"} />
              <Row k="Supplier" v="Sandhu Fuels, Ludhiana" />
              <div
                style={{
                  marginTop: 12,
                  background: WASH,
                  border: "1px solid " + RULE,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "#444",
                  borderRadius: 4,
                }}
              >
                Your operator sees the same date and can place this order with
                one tap.
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === "deliveries" && <DeliveriesTable deliveries={deliveries} />}
      {tab === "cost" && (
        <CostPerTonne history={history} litresPerTonne={litresPerTonne} />
      )}
      {tab === "alerts" && <Alerts alerts={alerts} />}
    </div>
  );
}

function KPI({
  label,
  value,
  num,
  format,
  note,
  noteColor,
  accent,
  big,
}: {
  label: string;
  value?: string;
  num?: number;
  format?: (n: number) => string;
  note: string;
  noteColor?: string;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? INK : PAPER,
        color: accent ? "#fff" : INK,
        border: "1px solid " + (accent ? INK : RULE),
        borderRadius: 6,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: accent ? "#A9AEB5" : MUTE,
        }}
      >
        {label}
      </div>
      <div
        className="tnum"
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: big ? 34 : 30,
          fontWeight: 800,
          marginTop: 6,
          letterSpacing: -1,
        }}
      >
        {num != null ? (
          <AnimatedNumber value={num} format={format} />
        ) : (
          value
        )}
      </div>
      <div
        style={{
          fontSize: 11.5,
          marginTop: 3,
          color: noteColor || (accent ? "#8A9098" : MUTE),
          fontWeight: noteColor ? 700 : 400,
        }}
      >
        {note}
      </div>
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: PAPER,
        border: "1px solid " + RULE,
        borderRadius: 6,
        padding: 18,
        marginTop: 14,
      }}
    >
      <div style={{ fontSize: 14.5, fontWeight: 800, fontFamily: FONT_DISPLAY }}>
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12.5,
            color: MUTE,
            marginTop: 3,
            marginBottom: 14,
            maxWidth: 660,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid " + RULE,
        fontSize: 13.5,
        gap: 12,
      }}
    >
      <span style={{ color: MUTE }}>{k}</span>
      <span
        className="tnum"
        style={{ fontWeight: strong ? 800 : 600, textAlign: "right" }}
      >
        {v}
      </span>
    </div>
  );
}
