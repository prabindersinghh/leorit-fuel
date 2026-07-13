/* ────────────────────────────────────────────────────────────
   SIMULATION — all fake data and demo actions, isolated here.
   This is the ONLY file that knows the data is fake. Views read
   through useSimulation(); swap this layer for a real API and the
   UI does not change.

   The reconciler below is a PURE function with the exact shape the
   real backend will expose (TRD §7). Tolerance is DERIVED per
   delivery, never hardcoded.
   ──────────────────────────────────────────────────────────── */

import type { DayRow, Delivery, DeliveryStatus } from "./types";
import { BASE_BURN } from "../theme";

const RATE = 91.4; // ₹ per litre, illustrative

/* ── the reconciler — TRD §7.3, tolerance derived per delivery ── */
export const METER_ACCURACY_PCT = 0.005; // ±0.5%
export const MIN_TOLERANCE_LITRES = 30;

export function toleranceFor(invoicedLitres: number): number {
  // floor binds below 6,000 L (6000*0.005 = 30); percentage binds above
  return Math.max(invoicedLitres * METER_ACCURACY_PCT, MIN_TOLERANCE_LITRES);
}

export interface Reconciled {
  actualLitres: number;
  varianceLitres: number;
  toleranceLitres: number;
  status: Exclude<DeliveryStatus, "awaiting_invoice">;
}

/** actual is measured; invoiced is entered by a human. Compare honestly. */
export function reconcile(
  levelBeforeL: number,
  levelAfterL: number,
  invoicedLitres: number
): Reconciled {
  const actualLitres = round1(levelAfterL - levelBeforeL);
  const varianceLitres = round1(invoicedLitres - actualLitres);
  const toleranceLitres = toleranceFor(invoicedLitres);
  const status: Reconciled["status"] =
    varianceLitres > toleranceLitres
      ? "short"
      : varianceLitres < -toleranceLitres
      ? "over"
      : "ok";
  return { actualLitres, varianceLitres, toleranceLitres, status };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ── seed deliveries ─────────────────────────────────────────
   Continuous distribution across the tolerance line — variance
   reads 18 · 28 · 48 · 52 · 142 · 158, no bimodal gap. Invoiced
   quantities vary (4,000 / 5,000 / 6,000 / 10,000) so the derived
   tolerance visibly changes (30 vs 50). Three short, two clean,
   one short-but-barely sitting just past the line — proof the
   tolerance is doing real work, not decorating a verdict.
   Built through reconcile() so the numbers are internally honest. */
function seedDelivery(
  id: string,
  dateLabel: string,
  detectedAt: string,
  invoiced: number,
  actual: number,
  supplier = "Sandhu Fuels"
): Delivery {
  const before = 3000; // representative pre-fill baseline
  const after = before + actual;
  const r = reconcile(before, after, invoiced);
  return {
    id,
    detectedAt,
    dateLabel,
    levelBeforeL: before,
    levelAfterL: after,
    actualLitres: r.actualLitres,
    invoicedLitres: invoiced,
    ratePerLitre: RATE,
    varianceLitres: r.varianceLitres,
    toleranceLitres: r.toleranceLitres,
    status: r.status,
    supplier,
  };
}

export function seedDeliveries(): Delivery[] {
  return [
    // variance 52, tol 30 → SHORT   (invoiced 6,000)
    seedDelivery("TKR-0421", "28 Jun", "2026-06-28T11:00:00", 6000, 5948),
    // variance 48, tol 30 → SHORT, barely — the dead-zone row (invoiced 5,000)
    seedDelivery("TKR-0416", "16 Jun", "2026-06-16T10:30:00", 5000, 4952),
    // variance 18, tol 30 → OK        (invoiced 4,000)
    seedDelivery("TKR-0402", "07 Jun", "2026-06-07T09:40:00", 4000, 3982),
    // variance 28, tol 30 → OK        (invoiced 6,000 — clean even at 6k)
    seedDelivery("TKR-0388", "31 May", "2026-05-31T14:10:00", 6000, 5972),
    // variance 158, tol 50 → SHORT    (invoiced 10,000 — double load, tol moves to 50)
    seedDelivery("TKR-0361", "19 May", "2026-05-19T12:20:00", 10000, 9842),
  ];
}

/* the today tanker used by the "Tanker arrives" sequence.
   Lands as awaiting_invoice, resolves to short. */
export const TODAY_TANKER = {
  invoiced: 5000,
  actual: 4858, // → variance 142, tolerance 30 → SHORT (the whole pitch, one number)
  rate: RATE,
  supplier: "Sandhu Fuels",
};

/* ── seed 21 days of plausible operating history ─────────────── */
export function seedHistory(): DayRow[] {
  const out: DayRow[] = [];
  let lvl = 8600;
  const today = new Date("2026-07-13T09:00:00");
  for (let i = 20; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const tonnes = dow === 0 ? 0 : 14 + Math.round(Math.sin(i * 1.3) * 3);
    const burn = dow === 0 ? 40 : Math.round(BASE_BURN * (tonnes / 15) + 60);
    lvl -= burn;
    if (lvl < 2400) lvl += 5000; // a refill happened
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      level: Math.round(lvl),
      burn,
      tonnes,
      lpt: tonnes ? round1(burn / tonnes) : 0,
    });
  }
  return out;
}

/* ── derived metrics from history (trailing 7 WORKING days) ──── */
export function burnRateOf(history: DayRow[]): number {
  const working = history.filter((h) => h.tonnes > 0).slice(-7);
  return Math.round(
    working.reduce((s, h) => s + h.burn, 0) / (working.length || 1)
  );
}

export function litresPerTonneOf(history: DayRow[]): number {
  const working = history.filter((h) => h.tonnes > 0).slice(-7);
  const totBurn = working.reduce((s, h) => s + h.burn, 0);
  const totTonnes = working.reduce((s, h) => s + h.tonnes, 0);
  return round1(totTonnes ? totBurn / totTonnes : 0);
}

/* extend history by n days for the "Skip days" action */
export function extendHistory(
  startLevel: number,
  dayOffset: number,
  n: number,
  rand: () => number
): { rows: DayRow[]; endLevel: number } {
  let lvl = startLevel;
  const rows: DayRow[] = [];
  const base = new Date("2026-07-13T09:00:00");
  base.setDate(base.getDate() + dayOffset);
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const tonnes = dow === 0 ? 0 : 13 + Math.round(rand() * 4);
    const burn = dow === 0 ? 40 : Math.round(BASE_BURN * (tonnes / 15) + 40);
    lvl = Math.max(0, lvl - burn);
    rows.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      level: Math.round(lvl),
      burn,
      tonnes,
      lpt: tonnes ? round1(burn / tonnes) : 0,
    });
  }
  return { rows, endLevel: lvl };
}

export { round1, RATE };
