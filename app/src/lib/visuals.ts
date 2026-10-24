/**
 * Pure data for the hand-written SVG visuals. Every value comes from the engine
 * (finance.ts); nothing here rounds. Geometry helpers only map those values to
 * positions and angles.
 */
import { calculate, myrDirection, pctChange, pppSpot, type MyrDirection, type Results } from './finance';
import { BASELINE_REAL_RATE_PCT } from './scenarios';

/* ---------- 5.1 Currency see-saw ---------- */

/** Degrees of tilt per 1% PPP quote change, and the cap (reached at a 3% move). */
export const SEESAW_DEG_PER_PCT = 5;
export const SEESAW_MAX_DEG = 15;

/**
 * Beam rotation in degrees (clockwise in SVG). Positive lifts the RM (left)
 * side: a falling MYR/USD quote (ringgit stronger) gives a positive angle.
 */
export function seesawAngle(quoteChangePct: number): number {
  const raw = -SEESAW_DEG_PER_PCT * quoteChangePct;
  return Math.max(-SEESAW_MAX_DEG, Math.min(SEESAW_MAX_DEG, raw === 0 ? 0 : raw));
}

export type SeesawSide = 'up' | 'down' | 'level';

/** Where the RM side sits; follows the engine's direction rule (ε on unrounded inputs). */
export function rmSide(direction: MyrDirection): SeesawSide {
  return direction === 'appreciates' ? 'up' : direction === 'depreciates' ? 'down' : 'level';
}

/* ---------- 5.3 Fisher stacked bar ---------- */

export type FisherPart = { key: 'real' | 'inflation' | 'cross'; value: number; start: number; end: number };

/**
 * Real rate + inflation + cross-term r·π = Fisher nominal rate, in percent.
 * The cross-term is the engine's exact-minus-approximate gap.
 */
export function fisherParts(r: Results, country: 'MY' | 'US'): { parts: FisherPart[]; total: number } {
  const real = (country === 'MY' ? r.rMY : r.rUS) * 100;
  const inflation = (country === 'MY' ? r.piMY : r.piUS) * 100;
  const cross = country === 'MY' ? r.nominalMYApproxGapPp : r.nominalUSApproxGapPp;
  const total = country === 'MY' ? r.nominalMYPct : r.nominalUSPct;
  const values: [FisherPart['key'], number][] = [
    ['real', real],
    ['inflation', inflation],
    ['cross', cross],
  ];
  let at = 0;
  const parts = values.map(([key, value]) => {
    const part = { key, value, start: at, end: at + value };
    at += value;
    return part;
  });
  return { parts, total };
}

/** Shared [min, max] (percent) so the Malaysia and US bars use one scale. */
export function fisherDomain(r: Results): [number, number] {
  const ends = (['MY', 'US'] as const).flatMap((c) => fisherParts(r, c).parts.flatMap((p) => [p.start, p.end]));
  return [Math.min(0, ...ends), Math.max(0, ...ends)];
}

/* ---------- 5.4 Sensitivity curve ---------- */

export const CURVE_MIN = -5;
export const CURVE_MAX = 15;

/** PPP-implied spot as π_US sweeps CURVE_MIN…CURVE_MAX (percent), π_MY and S₀ fixed. */
export function curvePoints(spot: number, myInflationPct: number, stepPct = 0.1): { x: number; y: number }[] {
  const n = Math.round((CURVE_MAX - CURVE_MIN) / stepPct);
  const points: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k += 1) {
    const x = CURVE_MIN + k * stepPct;
    points.push({ x, y: pppSpot(spot, myInflationPct / 100, x / 100) });
  }
  return points;
}

/** Snap a dragged or keyed value to the 0.1 pp slider grid inside the curve's range. */
export function snapCurveValue(pct: number): number {
  const clamped = Math.min(CURVE_MAX, Math.max(CURVE_MIN, pct));
  return Math.round(clamped * 10) / 10;
}

/* ---------- 5.5 Sensitivity heatmap ---------- */

export const HEAT_MIN = -5;
export const HEAT_MAX = 15;
export const HEAT_STEP = 1;

export type HeatCell = { myPct: number; usPct: number; quoteChangePct: number; ppp: number; direction: MyrDirection };

/** π_MY × π_US grid (percent) with the PPP quote change for each cell. */
export function heatmapCells(spot: number, min = HEAT_MIN, max = HEAT_MAX, step = HEAT_STEP): HeatCell[] {
  const cells: HeatCell[] = [];
  const n = Math.round((max - min) / step);
  for (let j = 0; j <= n; j += 1) {
    const usPct = min + j * step;
    for (let k = 0; k <= n; k += 1) {
      const myPct = min + k * step;
      const ppp = pppSpot(spot, myPct / 100, usPct / 100);
      cells.push({ myPct, usPct, ppp, quoteChangePct: pctChange(spot, ppp), direction: myrDirection(myPct / 100, usPct / 100) });
    }
  }
  return cells;
}

/** Signed intensity in [−1, 1] for the diverging colour scale (saturates at ±`cap` %). */
export function heatIntensity(quoteChangePct: number, cap = 12): number {
  return Math.max(-1, Math.min(1, quoteChangePct / cap));
}

/* ---------- 5.6 Shopping basket (PPP) ---------- */

/** A basket worth RM S₀ in Malaysia and US$1 in the US today; both inflate for a year. */
export function basketPrices(r: Results) {
  const rmToday = r.spot;
  const usdToday = 1;
  const rmNext = rmToday * (1 + r.piMY);
  const usdNext = usdToday * (1 + r.piUS);
  return { rmToday, usdToday, rmNext, usdNext, impliedRate: rmNext / usdNext };
}

/* ---------- 5.7 Two-route no-arbitrage (covered IRP) ---------- */

/** RM 1 invested at home vs converted, invested in the US and converted back at F. */
export function twoRoutes(r: Results) {
  const iMY = r.nominalMYPct / 100;
  const iUS = r.nominalUSPct / 100;
  const home = 1 + iMY;
  const usdNow = 1 / r.spot;
  const usdLater = usdNow * (1 + iUS);
  const abroadBack = usdLater * r.cipForward;
  return { start: 1, home, usdNow, usdLater, abroadBack };
}

/* ---------- Exact vs approximate (Learn More) ---------- */

/** Approximate vs exact PPP quote change when only π_US changes (for the error explorer). */
export function approxVsExact(
  spot: number,
  myInflationPct: number,
  usInflationPct: number,
  realRatePct = BASELINE_REAL_RATE_PCT,
) {
  const r = calculate({ myInflationPct, usInflationPct, realRatePct, spotMyrPerUsd: spot, advanced: false });
  return { approx: r.quoteChangeApproxPct, exact: r.quoteChangePct, errorPp: r.approxErrorPp, results: r };
}

/* ---------- Axis helpers ---------- */

/** Padded [lo, hi] around a set of exchange-rate levels. */
export function paddedDomain(values: number[], padShare = 0.2, minPad = 0.02): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * padShare, minPad);
  return [lo - pad, hi + pad];
}
