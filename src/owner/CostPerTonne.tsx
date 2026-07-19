import type { DayRow } from "../state/types";
import LptChart from "./charts/LptChart";
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
} from "../theme";

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid " + RULE,
  fontSize: 13,
};
const th: React.CSSProperties = {
  textAlign: "left",
  background: INK,
  color: "#fff",
  padding: "9px 12px",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.7,
  fontWeight: 700,
};

/* Litres of diesel per tonne of paint — the number a fuel vendor can never
   give you, because it needs the production join. Honest, no insights panel. */
export default function CostPerTonne({
  history,
  litresPerTonne,
}: {
  history: DayRow[];
  litresPerTonne: number;
}) {
  const workDays = history.filter((h) => h.tonnes > 0);
  return (
    <>
      <Panel
        title="Litres of diesel per tonne of paint"
        sub="This is the number your fuel supplier can never give you. It needs your production data, which already sits inside Leorit."
      >
        <div
          style={{
            display: "flex",
            gap: 26,
            alignItems: "flex-end",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              className="tnum"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(38px, 10vw, 54px)",
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              {litresPerTonne}
            </div>
            <div style={{ color: MUTE, fontSize: 13, fontWeight: 600 }}>
              litres of diesel per tonne
            </div>
          </div>
          <div
            style={{
              borderLeft: "1px solid " + RULE,
              paddingLeft: 22,
              paddingBottom: 6,
            }}
          >
            <div
              className="tnum"
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: FONT_DISPLAY,
              }}
            >
              {money(litresPerTonne * 91)}
            </div>
            <div style={{ color: MUTE, fontSize: 13 }}>
              of diesel in every tonne you make
            </div>
          </div>
        </div>
        <LptChart data={workDays.slice(-14)} />
      </Panel>

      <Panel
        title="Production against fuel"
        sub="Days when the two drift apart are worth a second look — not an accusation, a prompt."
      >
        <div className="scroll-x">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 520,
            }}
          >
            <thead>
              <tr>
                {["Date", "Paint made", "Diesel used", "Litres per tonne"].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {workDays
                .slice(-8)
                .reverse()
                .map((h, i) => {
                  const off = h.lpt > litresPerTonne * 1.12;
                  return (
                    <tr key={h.date} style={{ background: i % 2 ? WASH : PAPER }}>
                      <td style={td}>{h.label}</td>
                      <td style={td} className="tnum">
                        {h.tonnes} tonnes
                      </td>
                      <td style={td} className="tnum">
                        {fmt(h.burn)} L
                      </td>
                      <td
                        className="tnum"
                        style={{
                          ...td,
                          fontWeight: 700,
                          color: off ? BAD : INK,
                        }}
                      >
                        {h.lpt} L
                        {off && (
                          <span
                            style={{
                              fontSize: 11,
                              marginLeft: 8,
                              fontWeight: 600,
                            }}
                          >
                            above normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
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
