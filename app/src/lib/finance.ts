/**
 * ParityLab finance engine — pure functions, no React, no rounding.
 *
 * Quotation convention: S = MYR per 1 USD (MYR/USD).
 * Percentages arrive as percentage numbers (2.5 means 2.5%) and are converted to
 * decimals exactly once, in `toDecimals`. Every output keeps full floating-point
 * precision; rounding happens only in format.ts at display time.
 */

export type Inputs = {
  myInflationPct: number;
  usInflationPct: number;
  /** Common real rate shared by both countries (core mode). */
  realRatePct: number;
  /** Advanced mode only: Malaysian real rate. */
  myRealRatePct?: number;
  /** Advanced mode only: US real rate. */
  usRealRatePct?: number;
  spotMyrPerUsd: number;
  advanced: boolean;
};

export type MyrDirection = 'appreciates' | 'depreciates' | 'unchanged';

export type Results = {
  /** Decimal inputs actually used (after percent-to-decimal conversion). */
  piMY: number;
  piUS: number;
  rMY: number;
  rUS: number;
  spot: number;

  nominalMYPct: number;
  nominalUSPct: number;
  nominalMYApproxPct: number;
  nominalUSApproxPct: number;
  /** Exact minus approximate Fisher rate, in percentage points. */
  nominalMYApproxGapPp: number;
  nominalUSApproxGapPp: number;
  /** (i_MY − i_US) × 100, percentage points. */
  nominalDiffPp: number;
  /** (π_MY − π_US) × 100, percentage points. */
  inflationDiffPp: number;

  pppSpot: number;
  cipForward: number;
  ifeSpot: number;

  /** Exact % change in the MYR/USD quote implied by relative PPP. */
  quoteChangePct: number;
  /** Approximation (π_MY − π_US) × 100, comparison only. */
  quoteChangeApproxPct: number;
  /** Approximate minus exact quote change, percentage points (signed). */
  approxErrorPp: number;
  /** % change in the MYR's value measured in USD (reciprocal quote). */
  myrValueChangePct: number;
  /** 100 × (F/S0 − 1); negative = forward discount on USD. */
  usdForwardPremiumPct: number;
  /** Exact % change S_IFE / S0 − 1. */
  ifeChangePct: number;
  /** Approximation (i_MY − i_US) × 100, comparison only. */
  ifeChangeApproxPct: number;

  parityMatch: boolean;
  /** F_CIP − S_PPP in MYR/USD. Zero (to machine precision) when real rates are equal. */
  parityGap: number;
  /** (1 + r_MY) / (1 + r_US) = F_CIP / S_PPP. */
  realRateRatio: number;
  myrDirection: MyrDirection;
};

/** Tolerance for treating two decimal inflation rates as equal. */
export const DIRECTION_EPSILON = 1e-12;
/** Relative tolerance for the PPP = CIP parity check. */
export const PARITY_TOLERANCE = 1e-10;

/** Fisher (exact): i = (1 + r)(1 + π) − 1. Decimal in, decimal out. */
export function fisherNominal(r: number, pi: number): number {
  return (1 + r) * (1 + pi) - 1;
}

/** Fisher (approximation): i ≈ r + π. Comparison only. */
export function fisherApprox(r: number, pi: number): number {
  return r + pi;
}

/** Relative PPP: S_PPP = S0 (1 + π_MY) / (1 + π_US). */
export function pppSpot(spot: number, piMY: number, piUS: number): number {
  return (spot * (1 + piMY)) / (1 + piUS);
}

/** Covered IRP: F = S0 (1 + i_MY) / (1 + i_US). */
export function cipForward(spot: number, iMY: number, iUS: number): number {
  return (spot * (1 + iMY)) / (1 + iUS);
}

/** IFE expected spot: same algebra as covered IRP, different economic meaning. */
export function ifeExpectedSpot(spot: number, iMY: number, iUS: number): number {
  return (spot * (1 + iMY)) / (1 + iUS);
}

/** Exact percentage change from `from` to `to`. */
export function pctChange(from: number, to: number): number {
  return 100 * (to / from - 1);
}

export function myrDirection(piMY: number, piUS: number): MyrDirection {
  const d = piMY - piUS;
  if (d < -DIRECTION_EPSILON) return 'appreciates';
  if (d > DIRECTION_EPSILON) return 'depreciates';
  return 'unchanged';
}

export function parityMatches(ppp: number, cip: number, spot: number): boolean {
  return Math.abs(ppp - cip) < PARITY_TOLERANCE * Math.max(1, spot);
}

/** ∂S_PPP/∂π_US = −S0 (1 + π_MY) / (1 + π_US)²  (decimal π). */
export function dPppDPiUS(spot: number, piMY: number, piUS: number): number {
  return (-spot * (1 + piMY)) / ((1 + piUS) * (1 + piUS));
}

/** ∂S_PPP/∂π_MY = S0 / (1 + π_US)  (decimal π). */
export function dPppDPiMY(spot: number, piUS: number): number {
  return spot / (1 + piUS);
}

/** ∂i/∂π = 1 + r. */
export function dNominalDPi(r: number): number {
  return 1 + r;
}

type Decimals = { piMY: number; piUS: number; rMY: number; rUS: number; spot: number };

/** The single percent-to-decimal conversion point for the engine. */
export function toDecimals(x: Inputs): Decimals {
  const rMYPct = x.advanced ? (x.myRealRatePct ?? x.realRatePct) : x.realRatePct;
  const rUSPct = x.advanced ? (x.usRealRatePct ?? x.realRatePct) : x.realRatePct;
  return {
    piMY: x.myInflationPct / 100,
    piUS: x.usInflationPct / 100,
    rMY: rMYPct / 100,
    rUS: rUSPct / 100,
    spot: x.spotMyrPerUsd,
  };
}

/**
 * Run the whole parity chain. Callers should validate first (validation.ts);
 * this guard only stops impossible inputs from producing meaningless numbers.
 */
export function calculate(x: Inputs): Results {
  const { piMY, piUS, rMY, rUS, spot } = toDecimals(x);

  if (![piMY, piUS, rMY, rUS, spot].every(Number.isFinite)) {
    throw new Error('All inputs must be finite numbers.');
  }
  if (spot <= 0 || piMY <= -1 || piUS <= -1 || rMY <= -1 || rUS <= -1) {
    throw new Error('Spot must be positive and every rate must be greater than −100%.');
  }

  const iMY = fisherNominal(rMY, piMY);
  const iUS = fisherNominal(rUS, piUS);
  const iMYApprox = fisherApprox(rMY, piMY);
  const iUSApprox = fisherApprox(rUS, piUS);

  const ppp = pppSpot(spot, piMY, piUS);
  const cip = cipForward(spot, iMY, iUS);
  const ife = ifeExpectedSpot(spot, iMY, iUS);

  const quoteChangePct = pctChange(spot, ppp);
  const quoteChangeApproxPct = (piMY - piUS) * 100;

  return {
    piMY,
    piUS,
    rMY,
    rUS,
    spot,

    nominalMYPct: iMY * 100,
    nominalUSPct: iUS * 100,
    nominalMYApproxPct: iMYApprox * 100,
    nominalUSApproxPct: iUSApprox * 100,
    nominalMYApproxGapPp: (iMY - iMYApprox) * 100,
    nominalUSApproxGapPp: (iUS - iUSApprox) * 100,
    nominalDiffPp: (iMY - iUS) * 100,
    inflationDiffPp: (piMY - piUS) * 100,

    pppSpot: ppp,
    cipForward: cip,
    ifeSpot: ife,

    quoteChangePct,
    quoteChangeApproxPct,
    approxErrorPp: quoteChangeApproxPct - quoteChangePct,
    myrValueChangePct: pctChange(ppp, spot),
    usdForwardPremiumPct: pctChange(spot, cip),
    ifeChangePct: pctChange(spot, ife),
    ifeChangeApproxPct: (iMY - iUS) * 100,

    parityMatch: parityMatches(ppp, cip, spot),
    parityGap: cip - ppp,
    realRateRatio: (1 + rMY) / (1 + rUS),
    myrDirection: myrDirection(piMY, piUS),
  };
}
