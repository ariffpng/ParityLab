import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  calculate,
  dNominalDPi,
  dPppDPiMY,
  dPppDPiUS,
  fisherNominal,
  pppSpot,
  type Inputs,
} from '../finance';
import { PRESETS, SENSITIVITY_CASES } from '../scenarios';
import { compareResults } from '../comparison';
import { formatSpot } from '../format';

const TOL = 9; // toBeCloseTo(x, 9) → |diff| < 5e-10

/** Reference values from the project report — percentages as printed. */
const REFERENCE = {
  A: { iMY: 4.0375, iUS: 4.545, diff: -0.5075, ppp: 4.3786407767, quote: -0.4854368932, value: 0.487804878, dir: 'appreciates' },
  B: { iMY: 4.0375, iUS: 6.575, diff: -2.5375, ppp: 4.2952380952, quote: -2.380952381, value: 2.4390243902, dir: 'appreciates' },
  C: { iMY: 4.0375, iUS: 4.0375, diff: 0, ppp: 4.4, quote: 0, value: 0, dir: 'unchanged' },
  D: { iMY: 6.575, iUS: 4.0375, diff: 2.5375, ppp: 4.507317073170732, quote: 2.4390243902, value: -2.380952381, dir: 'depreciates' },
  E: { iMY: 9.62, iUS: 2.515, diff: 7.105, ppp: 4.704950495049505, quote: 6.9306930693, value: -6.4814814815, dir: 'depreciates' },
  F: { iMY: 2.515, iUS: 9.62, diff: -7.105, ppp: 4.114814814814815, quote: -6.4814814815, value: 6.9306930693, dir: 'appreciates' },
} as const;

/** 4-dp display values printed in Section 6 for D–F. */
const DISPLAY_4DP = {
  D: { ppp: '4.5073', quote: 2.439, value: -2.381 },
  E: { ppp: '4.7050', quote: 6.9307, value: -6.4815 },
  F: { ppp: '4.1148', quote: -6.4815, value: 6.9307 },
} as const;

describe('T1 baseline arithmetic (Scenario A)', () => {
  const r = calculate(PRESETS.A.inputs);
  it('Fisher-implied nominal rates are 4.0375% and 4.5450%', () => {
    expect(r.nominalMYPct).toBeCloseTo(4.0375, TOL);
    expect(r.nominalUSPct).toBeCloseTo(4.545, TOL);
    expect(r.nominalDiffPp).toBeCloseTo(-0.5075, TOL);
  });
  it('PPP = CIP = IFE = 4.3786407767 MYR/USD', () => {
    expect(r.pppSpot).toBeCloseTo(4.3786407767, TOL);
    expect(r.cipForward).toBeCloseTo(4.3786407767, TOL);
    expect(r.ifeSpot).toBeCloseTo(4.3786407767, TOL);
    expect(r.parityMatch).toBe(true);
    expect(r.realRateRatio).toBe(1);
  });
  it('USD forward discount equals the PPP quote change (−0.4854%)', () => {
    expect(r.usdForwardPremiumPct).toBeCloseTo(-0.4854368932, TOL);
  });
});

describe('T2 shock arithmetic (Scenario B)', () => {
  const r = calculate(PRESETS.B.inputs);
  it('US nominal rate 6.5750%; PPP = CIP = 4.2952380952', () => {
    expect(r.nominalMYPct).toBeCloseTo(4.0375, TOL);
    expect(r.nominalUSPct).toBeCloseTo(6.575, TOL);
    expect(r.nominalDiffPp).toBeCloseTo(-2.5375, TOL);
    expect(r.pppSpot).toBeCloseTo(4.2952380952, TOL);
    expect(r.cipForward).toBeCloseTo(4.2952380952, TOL);
    expect(r.parityMatch).toBe(true);
  });
});

describe('T3 equal inflation (Scenario C)', () => {
  const r = calculate(PRESETS.C.inputs);
  it('PPP = 4.4000 and direction is unchanged', () => {
    expect(r.pppSpot).toBeCloseTo(4.4, TOL);
    expect(r.quoteChangePct).toBeCloseTo(0, TOL);
    expect(r.myrValueChangePct).toBeCloseTo(0, TOL);
    expect(r.myrDirection).toBe('unchanged');
  });
});

describe('T4 quote direction (π_MY 5%, π_US 2.5%)', () => {
  const r = calculate(PRESETS.D.inputs);
  it('PPP exceeds 4.4 and MYR depreciates', () => {
    expect(r.pppSpot).toBeGreaterThan(4.4);
    expect(r.quoteChangePct).toBeGreaterThan(0);
    expect(r.myrValueChangePct).toBeLessThan(0);
    expect(r.myrDirection).toBe('depreciates');
  });
});

describe('T5 reciprocal precision (Scenario A)', () => {
  const r = calculate(PRESETS.A.inputs);
  it('quote −0.4854368932%, MYR value +0.4878048780%', () => {
    expect(r.quoteChangePct).toBeCloseTo(-0.4854368932, TOL);
    expect(r.myrValueChangePct).toBeCloseTo(0.487804878, TOL);
  });
  it('the two percentage changes are not exact negatives of each other', () => {
    expect(Math.abs(r.quoteChangePct + r.myrValueChangePct)).toBeGreaterThan(1e-4);
  });
});

/** Small deterministic PRNG so the invariance test is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('T6 formula invariance under a common real rate', () => {
  it('|PPP − CIP| < 1e-10 × max(1, S0) for 5,000 random valid inputs', () => {
    const rand = mulberry32(20261116);
    const between = (lo: number, hi: number) => lo + (hi - lo) * rand();
    let worst = 0;
    for (let k = 0; k < 5000; k += 1) {
      const x: Inputs = {
        myInflationPct: between(-5, 15),
        usInflationPct: between(-5, 15),
        realRatePct: between(-3, 10),
        spotMyrPerUsd: between(0.1, 20),
        advanced: false,
      };
      const r = calculate(x);
      const scaled = Math.abs(r.pppSpot - r.cipForward) / Math.max(1, x.spotMyrPerUsd);
      worst = Math.max(worst, scaled);
      expect(r.parityMatch).toBe(true);
    }
    expect(worst).toBeLessThan(1e-10);
  });
});

describe('T7 advanced mode with unequal real rates', () => {
  const r = calculate(PRESETS.ADV.inputs);
  it('i_MY 4.0375%, i_US 5.5750%', () => {
    expect(r.nominalMYPct).toBeCloseTo(4.0375, TOL);
    expect(r.nominalUSPct).toBeCloseTo(5.575, TOL);
  });
  it('PPP 4.3786407767, CIP 4.3359223301, parityMatch false', () => {
    expect(r.pppSpot).toBeCloseTo(4.3786407767, TOL);
    expect(r.cipForward).toBeCloseTo(4.3359223301, TOL);
    expect(r.parityMatch).toBe(false);
    expect(r.parityGap).toBeCloseTo(4.3359223301 - 4.3786407767, TOL);
    expect(Math.abs(r.parityGap)).toBeGreaterThan(0.04);
  });
  it('F/S_PPP equals (1 + r_MY)/(1 + r_US) = 1.015/1.025', () => {
    expect(r.cipForward / r.pppSpot).toBeCloseTo(1.015 / 1.025, 12);
    expect(r.realRateRatio).toBeCloseTo(1.015 / 1.025, 12);
  });
  it('advanced mode with equal real rates behaves like core mode', () => {
    const eq = calculate({ ...PRESETS.ADV.inputs, usRealRatePct: 1.5 });
    expect(eq.parityMatch).toBe(true);
    expect(eq.cipForward).toBeCloseTo(4.3786407767, TOL);
  });
});

describe('T9 no early rounding', () => {
  it('engine outputs keep full floating-point precision', () => {
    const r = calculate(PRESETS.A.inputs);
    expect(r.pppSpot).toBe((4.4 * (1 + 0.025)) / (1 + 0.03));
    expect(r.pppSpot).not.toBe(4.3786);
    expect(r.nominalMYPct).toBe(((1 + 0.015) * (1 + 0.025) - 1) * 100);
  });
  it('the engine source never rounds or imports display formatting', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/finance.ts'), 'utf8');
    expect(src).not.toMatch(/toFixed|toPrecision|Math\.round|Math\.floor|Math\.ceil/);
    expect(src).not.toMatch(/from '\.\/format'/);
  });
  it('A→B differences use unrounded values, not displayed 4-dp values', () => {
    const a = calculate(PRESETS.A.inputs);
    const b = calculate(PRESETS.B.inputs);
    const row = compareResults(a, b).find((m) => m.key === 'pppSpot')!;
    const fromDisplay = Number(formatSpot(b.pppSpot)) - Number(formatSpot(a.pppSpot));
    expect(row.change).toBeCloseTo(4.2952380952 - 4.3786407767, TOL);
    expect(row.change).not.toBe(fromDisplay);
  });
  it('formatting does not mutate results', () => {
    const r = Object.freeze(calculate(PRESETS.B.inputs));
    expect(() => formatSpot(r.pppSpot)).not.toThrow();
    expect(r.pppSpot).toBe((4.4 * (1 + 0.025)) / (1 + 0.05));
  });
});

describe('Sensitivity cases A–F (Section 6)', () => {
  for (const preset of SENSITIVITY_CASES) {
    const id = preset.id as keyof typeof REFERENCE;
    const ref = REFERENCE[id];
    it(`case ${id} (${preset.name}) matches the reference row`, () => {
      const r = calculate(preset.inputs);
      expect(r.nominalMYPct).toBeCloseTo(ref.iMY, TOL);
      expect(r.nominalUSPct).toBeCloseTo(ref.iUS, TOL);
      expect(r.nominalDiffPp).toBeCloseTo(ref.diff, TOL);
      expect(r.pppSpot).toBeCloseTo(ref.ppp, TOL);
      expect(r.cipForward).toBeCloseTo(ref.ppp, TOL);
      expect(r.quoteChangePct).toBeCloseTo(ref.quote, TOL);
      expect(r.myrValueChangePct).toBeCloseTo(ref.value, TOL);
      expect(r.myrDirection).toBe(ref.dir);
    });
  }
  for (const id of ['D', 'E', 'F'] as const) {
    it(`case ${id} displays the printed 4-dp values`, () => {
      const r = calculate(PRESETS[id].inputs);
      expect(formatSpot(r.pppSpot)).toBe(DISPLAY_4DP[id].ppp);
      expect(formatSpot(r.cipForward)).toBe(DISPLAY_4DP[id].ppp);
      expect(Number(r.quoteChangePct.toFixed(4))).toBe(DISPLAY_4DP[id].quote);
      expect(Number(r.myrValueChangePct.toFixed(4))).toBe(DISPLAY_4DP[id].value);
    });
  }
});

describe('Approximations (comparison only)', () => {
  it('Scenario B: approx −2.5000% vs exact −2.3810% → overstates the fall by ≈0.1190 pp', () => {
    const r = calculate(PRESETS.B.inputs);
    expect(r.quoteChangeApproxPct).toBeCloseTo(-2.5, TOL);
    expect(r.approxErrorPp).toBeCloseTo(-2.5 + 2.380952380952381, TOL);
    expect(Number(Math.abs(r.approxErrorPp).toFixed(4))).toBe(0.119);
  });
  it('Scenario A: Fisher approx 4.0000% vs exact 4.0375%', () => {
    const r = calculate(PRESETS.A.inputs);
    expect(r.nominalMYApproxPct).toBeCloseTo(4.0, TOL);
    expect(r.nominalMYApproxGapPp).toBeCloseTo(0.0375, TOL);
  });
  it('IFE approximate change equals the nominal differential in pp', () => {
    const r = calculate(PRESETS.A.inputs);
    expect(r.ifeChangeApproxPct).toBeCloseTo(-0.5075, TOL);
    expect(r.ifeChangePct).toBeCloseTo(r.quoteChangePct, TOL);
  });
});

describe('Comparative statics', () => {
  it('+1 pp expected inflation → +1.015 pp Fisher-implied nominal rate at r = 1.5%', () => {
    const bump = (fisherNominal(0.015, 0.035) - fisherNominal(0.015, 0.025)) * 100;
    expect(bump).toBeCloseTo(1.015, TOL);
    expect(dNominalDPi(0.015)).toBeCloseTo(1.015, 12);
  });
  it('analytic PPP derivatives match finite differences', () => {
    const h = 1e-7;
    const numericUS = (pppSpot(4.4, 0.025, 0.03 + h) - pppSpot(4.4, 0.025, 0.03 - h)) / (2 * h);
    const numericMY = (pppSpot(4.4, 0.025 + h, 0.03) - pppSpot(4.4, 0.025 - h, 0.03)) / (2 * h);
    expect(dPppDPiUS(4.4, 0.025, 0.03)).toBeCloseTo(numericUS, 5);
    expect(dPppDPiMY(4.4, 0.03)).toBeCloseTo(numericMY, 5);
    expect(dPppDPiUS(4.4, 0.025, 0.03)).toBeLessThan(0);
    expect(dPppDPiMY(4.4, 0.03)).toBeGreaterThan(0);
  });
});

describe('Engine guards', () => {
  it('throws instead of returning numbers for impossible inputs', () => {
    const base = PRESETS.A.inputs;
    expect(() => calculate({ ...base, spotMyrPerUsd: 0 })).toThrow();
    expect(() => calculate({ ...base, spotMyrPerUsd: Number.NaN })).toThrow();
    expect(() => calculate({ ...base, usInflationPct: -100 })).toThrow();
    expect(() => calculate({ ...base, realRatePct: Number.POSITIVE_INFINITY })).toThrow();
  });
});
