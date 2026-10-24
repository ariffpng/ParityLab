/**
 * Preset teaching scenarios (report §3). All values are hypothetical assumptions,
 * not market observations. Each preset is a separate one-year scenario from the
 * same spot rate — not a time series.
 */
import type { Inputs } from './finance';

export type PresetId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'ADV';

export type Preset = {
  id: PresetId;
  name: string;
  description: string;
  inputs: Inputs;
};

export const BASELINE_SPOT = 4.4;
export const BASELINE_REAL_RATE_PCT = 1.5;

function core(myInflationPct: number, usInflationPct: number): Inputs {
  return {
    myInflationPct,
    usInflationPct,
    realRatePct: BASELINE_REAL_RATE_PCT,
    spotMyrPerUsd: BASELINE_SPOT,
    advanced: false,
  };
}

export const PRESETS: Record<PresetId, Preset> = {
  A: {
    id: 'A',
    name: 'Baseline',
    description: 'π_MY 2.50%, π_US 3.00%, common real rate 1.50%, S₀ 4.4000 MYR/USD.',
    inputs: core(2.5, 3.0),
  },
  B: {
    id: 'B',
    name: 'US inflation spike',
    description: 'US expected inflation raised from 3.00% to 5.00%; everything else held fixed.',
    inputs: core(2.5, 5.0),
  },
  C: {
    id: 'C',
    name: 'Equal inflation',
    description: 'Both countries expect 2.50% inflation.',
    inputs: core(2.5, 2.5),
  },
  D: {
    id: 'D',
    name: 'Malaysian inflation higher',
    description: 'π_MY 5.00% vs π_US 2.50%.',
    inputs: core(5.0, 2.5),
  },
  E: {
    id: 'E',
    name: 'Extreme Malaysian divergence',
    description: 'π_MY 8.00% vs π_US 1.00%.',
    inputs: core(8.0, 1.0),
  },
  F: {
    id: 'F',
    name: 'Extreme US divergence',
    description: 'π_MY 1.00% vs π_US 8.00%.',
    inputs: core(1.0, 8.0),
  },
  ADV: {
    id: 'ADV',
    name: 'Advanced: unequal real rates',
    description: 'Baseline inflation, but r_MY 1.50% and r_US 2.50% — PPP and CIP separate.',
    inputs: {
      myInflationPct: 2.5,
      usInflationPct: 3.0,
      realRatePct: 1.5,
      myRealRatePct: 1.5,
      usRealRatePct: 2.5,
      spotMyrPerUsd: BASELINE_SPOT,
      advanced: true,
    },
  },
};

export const BASELINE: Inputs = PRESETS.A.inputs;

/** The six-case sensitivity study A–F, in report order. */
export const SENSITIVITY_CASES: Preset[] = (['A', 'B', 'C', 'D', 'E', 'F'] as const).map((id) => PRESETS[id]);
