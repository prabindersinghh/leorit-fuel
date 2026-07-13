# Leorit Fuel Module — Demo

A visual demo prototype of the Leorit Fuel Module for Modern Colors Pvt Ltd, Ludhiana.

> **Simulated data.** Nothing in this demo is connected to a live tank. Every
> number — tank capacity, burn rate, litres per tonne, the short-delivery
> figures — is illustrative, for the purpose of a screen recording.

## What it is

A software layer that sits on top of a fuel meter, turning a raw level reading
into four things the client can act on:

1. A number instead of a guess.
2. A prediction instead of a phone call.
3. A verified delivery instead of a trusted invoice.
4. A cost per tonne instead of an unallocated expense.

## Two users, two screens

- **Operator** — flat, fast, one number and one button. No 3D. Built to work
  on a cheap Android phone over 3G. Demonstrates the stale-meter state, where
  the app withholds a number it can no longer trust.
- **Owner** — a dashboard that leads with rupees recovered, a real-time 3D
  cutaway of the buried tank (lazy-loaded, off the operator's critical path),
  a deliveries table with a visible per-delivery tolerance column, and cost
  per tonne of paint.

## Stack

Vite + React 18 + TypeScript. 3D via react-three-fiber + drei, code-split so
`three.js` never loads on the operator view. Self-hosted fonts (Space Grotesk
+ Inter), no runtime CDN. All state simulated in memory behind a single
swappable hook (`src/state/useSimulation.ts`), shaped to the real data model so
the backend swap is mechanical.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # tsc + vite build
npm run preview    # serve the production build
```

## Deploy

Deploys to Vercel with zero configuration — it auto-detects Vite. `vercel.json`
pins the framework, build command, output directory, and SPA rewrites.
