/* ────────────────────────────────────────────────────────────
   useSimulation — THE SEAM.
   Every view reads state and calls actions through this one hook.
   When the real backend arrives you replace the internals here
   (fetch / websocket) and the views do not change.
   ──────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Alert,
  Delivery,
  DayRow,
  WaMessage,
} from "./types";
import {
  burnRateOf,
  extendHistory,
  litresPerTonneOf,
  reconcile,
  round1,
  seedDeliveries,
  seedHistory,
  toleranceFor,
  TODAY_TANKER,
} from "./simulation";
import {
  CAP,
  HEADROOM_PCT,
  fmt,
  money,
  REORDER,
  statusOf,
  statusWord,
} from "../theme";

const START_LEVEL = 4180;

export interface Sim {
  /* live state */
  level: number;
  history: DayRow[];
  deliveries: Delivery[];
  alerts: Alert[];
  ordered: boolean;
  meterOnline: boolean;
  lastReadingMinsAgo: number;
  day: number;

  /* transient UI */
  toast: string | null;
  wa: WaMessage | null;
  closeWa: () => void;

  /* derived */
  burnRate: number;
  daysLeft: number;
  litresPerTonne: number;
  ullage: number;
  orderByStr: string;
  status: "ok" | "low" | "critical";
  statusWordText: string;

  /* actions */
  skipDays: (n: number) => void;
  tankerArrives: () => void;
  meterOffline: () => void;
  nightTheft: () => void;
  placeOrder: () => void;
  reset: () => void;
}

export function useSimulation(): Sim {
  const [level, setLevel] = useState(START_LEVEL);
  const [history, setHistory] = useState<DayRow[]>(seedHistory);
  const [deliveries, setDeliveries] = useState<Delivery[]>(seedDeliveries);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [wa, setWa] = useState<WaMessage | null>(null);
  const [ordered, setOrdered] = useState(false);
  const [day, setDay] = useState(0);
  const [live, setLive] = useState(true);
  const [meterOnline, setMeterOnline] = useState(true);
  const [lastReadingMinsAgo, setLastReadingMinsAgo] = useState(0);
  const firedLow = useRef(false);
  const busy = useRef(false); // guards overlapping animated actions

  /* ── ambient live drip so the number is never static on camera ── */
  useEffect(() => {
    if (!live || !meterOnline) return;
    const t = setInterval(() => {
      setLevel((l) => Math.max(0, l - Math.random() * 1.4));
    }, 900);
    return () => clearInterval(t);
  }, [live, meterOnline]);

  /* ── derived metrics ─────────────────────────────────────────── */
  const burnRate = useMemo(() => burnRateOf(history), [history]);
  const litresPerTonne = useMemo(() => litresPerTonneOf(history), [history]);
  const daysLeft = round1(level / (burnRate || 1));
  const ullage = Math.max(0, CAP - level - (CAP * HEADROOM_PCT) / 100);
  const status = statusOf(level);
  const statusWordText = statusWord(level);

  const orderByStr = useMemo(() => {
    const orderBy = new Date("2026-07-13T09:00:00");
    orderBy.setDate(orderBy.getDate() + Math.max(0, Math.floor(daysLeft) - 1));
    return orderBy.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }, [daysLeft]);

  /* ── helpers ─────────────────────────────────────────────────── */
  const push = useCallback((a: Omit<Alert, "id" | "createdAt">) => {
    setAlerts((x) => [
      { ...a, id: Math.random().toString(36).slice(2), createdAt: Date.now() },
      ...x,
    ]);
  }, []);

  const ping = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const closeWa = useCallback(() => setWa(null), []);

  const nowTime = () =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ── fire the low-fuel WhatsApp automatically, once per crossing ── */
  useEffect(() => {
    if (!meterOnline) return; // never advise on a level we don't trust
    if (level <= REORDER && !firedLow.current && !ordered) {
      firedLow.current = true;
      setWa({
        kind: "low",
        time: nowTime(),
        lines: [
          `Diesel low. ${fmt(level)} litres left.`,
          `That is about ${daysLeft} days at your current use.`,
          `Order ${fmt(ullage)} litres by ${orderByStr}.`,
        ],
      });
      push({
        kind: "low_fuel",
        severity: "warn",
        observation: `${fmt(level)} L left. About ${daysLeft} days remaining.`,
        recommendation: `Order by ${orderByStr}.`,
      });
    }
    if (level > REORDER) firedLow.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, ordered, meterOnline]);

  /* ── DEMO ACTIONS ────────────────────────────────────────────── */

  const skipDays = useCallback(
    (n: number) => {
      if (busy.current) return;
      setMeterOnline(true);
      setLive(false);
      const { rows, endLevel } = extendHistory(level, day, n, Math.random);
      setHistory((h) => [...h, ...rows].slice(-28));
      setLevel(endLevel);
      setDay((d) => d + n);
      setLive(true);
      ping(`${n} days passed. Consumption recorded.`);
    },
    [history, level, day, ping]
  );

  const tankerArrives = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setMeterOnline(true);
    setLive(false);

    const { invoiced, actual, rate, supplier } = TODAY_TANKER;
    const before = level;
    const id = "TKR-04" + (33 + (deliveries.length - 5));
    const tol = toleranceFor(invoiced);

    // BEAT 1 — the row lands as AWAITING INVOICE while the fuel rises.
    const pending: Delivery = {
      id,
      detectedAt: new Date().toISOString(),
      dateLabel: "13 Jul",
      levelBeforeL: round1(before),
      levelAfterL: round1(before + actual),
      actualLitres: actual,
      invoicedLitres: undefined,
      ratePerLitre: rate,
      varianceLitres: undefined,
      toleranceLitres: tol,
      status: "awaiting_invoice",
      supplier,
    };
    setDeliveries((d) => [pending, ...d]);
    push({
      kind: "delivery",
      severity: "info",
      observation: `Delivery detected. Tank measured +${fmt(
        actual
      )} L after settling.`,
      recommendation: `Awaiting the invoiced quantity to reconcile.`,
    });

    // animate the fill so the camera catches it
    let filled = 0;
    const step = actual / 22;
    const iv = window.setInterval(() => {
      filled += step;
      setLevel((l) => Math.min(CAP, l + step));
      if (filled >= actual) {
        window.clearInterval(iv);
        setLevel(round1(before + actual));
        setLive(true);

        // BEAT 2 — WhatsApp asks the operator for the invoice (TRD §7.4)
        setWa({
          kind: "delivery_ask",
          time: nowTime(),
          lines: [
            `Tanker ${id} unloaded.`,
            `Tank received ${fmt(actual)} litres.`,
            `What does the invoice say? Reply with the number.`,
          ],
        });
        ping("Delivery measured. Awaiting invoice.");

        // BEAT 3 — the invoice arrives; reconcile in place → SHORT
        window.setTimeout(() => {
          const r = reconcile(before, before + actual, invoiced);
          setDeliveries((d) =>
            d.map((x) =>
              x.id === id
                ? {
                    ...x,
                    invoicedLitres: invoiced,
                    varianceLitres: r.varianceLitres,
                    toleranceLitres: r.toleranceLitres,
                    status: r.status,
                  }
                : x
            )
          );
          setOrdered(false);
          const shortfall = r.varianceLitres;
          push({
            kind: "short_delivery",
            severity: "critical",
            observation: `${id}: invoiced ${fmt(invoiced)} L, tank received ${fmt(
              actual
            )} L. Short by ${fmt(shortfall)} L (tolerance ±${fmt(tol)} L).`,
            recommendation: `Worth ${money(shortfall * rate)}. Raise with supplier.`,
          });
          setWa({
            kind: "short",
            time: nowTime(),
            lines: [
              `Invoice for ${id}: ${fmt(invoiced)} litres.`,
              `Tank received ${fmt(actual)} litres.`,
              `Short by ${fmt(shortfall)} litres — beyond the ±${fmt(
                tol
              )} L meter tolerance.`,
              `That is ${money(shortfall * rate)}.`,
            ],
          });
          ping("Invoice reconciled. Short delivery logged.");
          busy.current = false;
        }, 2100);
      }
    }, 70);
  }, [level, deliveries.length, push, ping]);

  const meterOffline = useCallback(() => {
    if (busy.current) return;
    setLive(false);
    setMeterOnline(false);
    setLastReadingMinsAgo(240); // "4 hours ago"
    push({
      kind: "anomaly",
      severity: "warn",
      observation: `Meter stopped reporting. Last reading 4 hours ago.`,
      recommendation: `Level shown is last known, not live. Do not order on it.`,
    });
    ping("Meter offline. Showing last known level.");
  }, [push, ping]);

  const nightTheft = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setMeterOnline(true);
    setLive(false);
    let gone = 0;
    const iv = window.setInterval(() => {
      gone += 8;
      setLevel((l) => Math.max(0, l - 8));
      if (gone >= 180) {
        window.clearInterval(iv);
        setLive(true);
        // observation, never conclusion (PRD §6.7 / TRD §8)
        push({
          kind: "anomaly",
          severity: "critical",
          observation: `180 L left the tank between 01:40 and 02:10. The outlet flow meter recorded no draw. No shift was running.`,
          recommendation: `Please check the tank.`,
        });
        setWa({
          kind: "theft",
          time: "02:11",
          lines: [
            `Fuel left the tank at 01:40.`,
            `180 litres gone in 30 minutes.`,
            `The factory drew nothing. No shift was running.`,
            `Please check the tank.`,
          ],
        });
        ping("Anomaly detected.");
        busy.current = false;
      }
    }, 60);
  }, [push, ping]);

  const placeOrder = useCallback(() => {
    setOrdered(true);
    push({
      kind: "order_placed",
      severity: "info",
      observation: `${fmt(ullage)} L ordered from Sandhu Fuels.`,
      recommendation: `Expected within 48 hours.`,
    });
    ping(`Order sent. ${fmt(ullage)} litres.`);
  }, [ullage, push, ping]);

  const reset = useCallback(() => {
    busy.current = false;
    setLevel(START_LEVEL);
    setHistory(seedHistory());
    setDeliveries(seedDeliveries());
    setAlerts([]);
    setOrdered(false);
    setDay(0);
    setWa(null);
    setMeterOnline(true);
    setLastReadingMinsAgo(0);
    firedLow.current = false;
    setLive(true);
    ping("Demo reset.");
  }, [ping]);

  return {
    level,
    history,
    deliveries,
    alerts,
    ordered,
    meterOnline,
    lastReadingMinsAgo,
    day,
    toast,
    wa,
    closeWa,
    burnRate,
    daysLeft,
    litresPerTonne,
    ullage,
    orderByStr,
    status,
    statusWordText,
    skipDays,
    tankerArrives,
    meterOffline,
    nightTheft,
    placeOrder,
    reset,
  };
}
