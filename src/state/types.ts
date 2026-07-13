/* ────────────────────────────────────────────────────────────
   STATE MODEL — shaped to TRD §3 tables so the eventual backend
   swap is mechanical. Every field here has a column there.
   The UI consumes these types; when the real API lands, only the
   data source (useSimulation) changes, not the views.
   ──────────────────────────────────────────────────────────── */

export type DeliveryStatus = "awaiting_invoice" | "ok" | "short" | "over";
export type AlertKind =
  | "low_fuel"
  | "order_placed"
  | "delivery"
  | "short_delivery"
  | "anomaly";
export type Severity = "info" | "warn" | "critical";
export type ReadingQuality = "ok" | "suspect" | "stale";

/** TRD §3 `tank` */
export interface Tank {
  id: string;
  name: string;
  capacityLitres: number;
  headroomPct: number;
  reorderLitres: number;
  criticalLitres: number;
  meterVendor: string;
}

/** TRD §3 `reading` (the derived, temp-corrected litres the UI shows) */
export interface Reading {
  ts: string; // ingest time (ISO)
  meterTs?: string;
  rawReading: number; // NEVER discarded in the real system
  temperatureC?: number;
  litres: number;
  quality: ReadingQuality;
}

/** TRD §3 `delivery` — the revenue feature's row */
export interface Delivery {
  id: string;
  detectedAt: string; // ISO
  dateLabel: string; // display convenience
  levelBeforeL: number;
  levelAfterL: number;
  actualLitres: number; // after − before (measured)
  invoicedLitres?: number; // NULL until a human enters it (TRD §7.4)
  invoicedBy?: string;
  ratePerLitre?: number;
  varianceLitres?: number; // invoiced − actual (undefined until invoiced)
  toleranceLitres: number; // max(invoiced*0.005, 30) — computed per delivery
  status: DeliveryStatus;
  supplier: string;
}

/** TRD §3 `alert` — observation, never conclusion */
export interface Alert {
  id: string;
  kind: AlertKind;
  severity: Severity;
  observation: string; // what we SAW. facts only.
  recommendation?: string; // what to do. optional.
  createdAt: number;
  whatsappSentAt?: number;
}

/** TRD §3 `fuel_order` — quantity computed, never typed */
export interface FuelOrder {
  id: string;
  placedBy: string;
  quantityLitres: number; // system computed (safe ullage)
  supplier: string;
  placedAt: number;
}

/** a day of production+fuel, for burn rate and litres-per-tonne */
export interface DayRow {
  date: string;
  label: string;
  level: number;
  burn: number; // litres consumed
  tonnes: number; // paint produced
  lpt: number; // litres per tonne
}

/** whatsapp thread message shape */
export interface WaMessage {
  kind: "low" | "short" | "theft" | "delivery_ask" | "order";
  lines: string[];
  time: string;
}
