/* ────────────────────────────────────────────────────────────
   THE LOCKED PALETTE
   These hex values are law. They match the printed proposal the
   client is holding. Monochrome + GOOD/WARN/BAD for status only.
   No fourth colour enters the product. Ever.
   ──────────────────────────────────────────────────────────── */

export const INK = "#14161A";
export const PAPER = "#FFFFFF";
export const WASH = "#F4F5F7";
export const RULE = "#E2E4E8";
export const MUTE = "#8A9098";

export const GOOD = "#1F7A4C";
export const WARN = "#B57A10";
export const BAD = "#B3261E";

/* charcoal steps used only for surfaces/3D — all inside the monochrome family */
export const CHARCOAL = "#0A0B0D";
export const STEEL = "#3A3F47";
export const STEEL_HI = "#5A6069";

/* ── Type tokens ─────────────────────────────────────────────
   display = Space Grotesk (engineered, tabular figures) for
             headings and the big litre count.
   body    = Inter (neutral, legible on a cheap panel).
   Both self-hosted (see fonts.css). No CDN. */
export const FONT_DISPLAY =
  "'Space Grotesk', ui-sans-serif, system-ui, 'Segoe UI', sans-serif";
export const FONT_BODY =
  "'Inter', ui-sans-serif, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* tabular numerals — used everywhere a number changes so digits do not jitter */
export const TABULAR = "tabular-nums" as const;

/* ── Tank / product constants (mirror TRD §3 tank row) ──────── */
export const CAP = 10000; // capacity_litres
export const HEADROOM_PCT = 2.0; // headroom_pct (default 2% per PRD §6.5)
export const REORDER = 3000; // reorder_litres
export const CRITICAL = 1500; // critical_litres
export const BASE_BURN = 620; // seed burn, litres per working day

/* ── formatters (en-IN) ─────────────────────────────────────── */
export const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
export const money = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** status colour for a given level — the ONLY place colour is decided */
export function statusOf(level: number): "ok" | "low" | "critical" {
  return level <= CRITICAL ? "critical" : level <= REORDER ? "low" : "ok";
}
export function statusColor(level: number): string {
  const s = statusOf(level);
  return s === "critical" ? BAD : s === "low" ? WARN : GOOD;
}
export function statusWord(level: number): string {
  const s = statusOf(level);
  return s === "critical" ? "Order now" : s === "low" ? "Order soon" : "Healthy";
}
