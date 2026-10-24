import { describe, expect, it } from 'vitest';
import { calculate } from '../finance';
import { PRESETS } from '../scenarios';
import {
  basketPrices,
  curvePoints,
  fisherDomain,
  fisherParts,
  heatIntensity,
  heatmapCells,
  rmSide,
  SEESAW_MAX_DEG,
  seesawAngle,
  snapCurveValue,
  twoRoutes,
  approxVsExact,
  paddedDomain,
} from '../visuals';

const A = calculate(PRESETS.A.inputs);
const B = calculate(PRESETS.B.inputs);

describe('see-saw', () => {
  it('lifts the RM side (positive angle) when MYR/USD falls, drops it when it rises, level when unchanged', () => {
    expect(seesawAngle(A.quoteChangePct)).toBeGreaterThan(0);
    expect(seesawAngle(calculate(PRESETS.D.inputs).quoteChangePct)).toBeLessThan(0);
    expect(seesawAngle(calculate(PRESETS.C.inputs).quoteChangePct)).toBe(0);
    expect(rmSide(A.myrDirection)).toBe('up');
    expect(rmSide(calculate(PRESETS.D.inputs).myrDirection)).toBe('down');
    expect(rmSide(calculate(PRESETS.C.inputs).myrDirection)).toBe('level');
  });

  it('is proportional (5° per 1%) and capped at ±15°', () => {
    expect(seesawAngle(-2)).toBeCloseTo(10, 12);
    expect(seesawAngle(1)).toBeCloseTo(-5, 12);
    expect(seesawAngle(A.quoteChangePct)).toBeCloseTo(-5 * A.quoteChangePct, 12);
    expect(seesawAngle(calculate(PRESETS.E.inputs).quoteChangePct)).toBe(-SEESAW_MAX_DEG);
    expect(seesawAngle(calculate(PRESETS.F.inputs).quoteChangePct)).toBe(SEESAW_MAX_DEG);
  });
});

describe('Fisher stacked bar', () => {
  it('real + inflation + cross-term ends exactly at the engine nominal rate', () => {
    for (const c of ['MY', 'US'] as const) {
      const { parts, total } = fisherParts(A, c);
      expect(parts.map((p) => p.key)).toEqual(['real', 'inflation', 'cross']);
      expect(parts[2].end).toBeCloseTo(total, 12);
    }
    expect(fisherParts(A, 'MY').total).toBeCloseTo(4.0375, 12);
    expect(fisherParts(A, 'MY').parts[2].value).toBeCloseTo(0.0375, 12);
  });

  it('handles negative real rates and deflation with a shared domain', () => {
    const r = calculate({ myInflationPct: -5, usInflationPct: 15, realRatePct: -3, spotMyrPerUsd: 4.4, advanced: false });
    const [lo, hi] = fisherDomain(r);
    expect(lo).toBeLessThan(0);
    expect(hi).toBeGreaterThan(0);
    expect(fisherParts(r, 'MY').parts[2].end).toBeCloseTo(r.nominalMYPct, 12);
  });
});

describe('sensitivity curve and heatmap data', () => {
  it('curve points come from the PPP formula and span −5% to 15%', () => {
    const pts = curvePoints(4.4, 2.5);
    expect(pts).toHaveLength(201);
    expect(pts[0].x).toBe(-5);
    expect(pts[200].x).toBeCloseTo(15, 9);
    const at5 = pts.find((p) => Math.abs(p.x - 5) < 1e-9)!;
    expect(at5.y).toBeCloseTo(B.pppSpot, 10);
  });

  it('snaps dragged values to the 0.1 pp grid inside the range', () => {
    expect(snapCurveValue(5.04)).toBe(5);
    expect(snapCurveValue(5.06)).toBe(5.1);
    expect(snapCurveValue(99)).toBe(15);
    expect(snapCurveValue(-99)).toBe(-5);
  });

  it('heatmap is a 21 × 21 grid with "no change" on the diagonal', () => {
    const cells = heatmapCells(4.4);
    expect(cells).toHaveLength(441);
    const diagonal = cells.filter((c) => c.myPct === c.usPct);
    expect(diagonal).toHaveLength(21);
    for (const c of diagonal) {
      expect(c.direction).toBe('unchanged');
      expect(c.quoteChangePct).toBeCloseTo(0, 10);
    }
    const b = cells.find((c) => c.myPct === 2 && c.usPct === 5)!;
    expect(b.direction).toBe('appreciates');
    expect(b.ppp).toBeCloseTo(calculate({ ...PRESETS.A.inputs, myInflationPct: 2, usInflationPct: 5 }).pppSpot, 12);
    expect(heatIntensity(-30)).toBe(-1);
    expect(heatIntensity(6)).toBeCloseTo(0.5, 12);
  });
});

describe('teaching visuals match the engine', () => {
  it('the shopping basket implies exactly the PPP rate', () => {
    for (const p of Object.values(PRESETS)) {
      const r = calculate(p.inputs);
      expect(basketPrices(r).impliedRate).toBeCloseTo(r.pppSpot, 12);
    }
    const basket = basketPrices(A);
    expect(basket.rmNext).toBeCloseTo(4.51, 12);
    expect(basket.usdNext).toBeCloseTo(1.03, 12);
  });

  it('both covered routes end with the same ringgit amount (no arbitrage)', () => {
    for (const p of Object.values(PRESETS)) {
      const route = twoRoutes(calculate(p.inputs));
      expect(route.abroadBack).toBeCloseTo(route.home, 12);
    }
    expect(twoRoutes(A).home).toBeCloseTo(1.040375, 12);
  });

  it('approx vs exact explorer reproduces Scenario B (error 0.1190 pp)', () => {
    const v = approxVsExact(4.4, 2.5, 5);
    expect(v.approx).toBeCloseTo(-2.5, 12);
    expect(v.exact).toBeCloseTo(B.quoteChangePct, 12);
    expect(v.errorPp).toBeCloseTo(-0.119047619, 9);
  });

  it('padded domain contains every value', () => {
    const [lo, hi] = paddedDomain([4.4, 4.2952]);
    expect(lo).toBeLessThan(4.2952);
    expect(hi).toBeGreaterThan(4.4);
  });
});
