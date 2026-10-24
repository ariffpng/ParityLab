import { describe, expect, it } from 'vitest';
import { calculate, type Inputs } from '../finance';
import {
  approxVerdict,
  changesVsBaseline,
  directionWords,
  interpret,
  oneLineSummary,
  SCENARIO_B_CAVEAT,
  shouldShowSpikeCallout,
  SPIKE_CALLOUT,
  stripMarkup,
} from '../interpretation';
import { PRESETS } from '../scenarios';

function run(x: Inputs) {
  return interpret(x, calculate(x));
}

describe('Interpretation templates', () => {
  it('d < 0 (US inflation higher): lower MYR/USD, MYR appreciates, live numbers', () => {
    const i = run(PRESETS.A.inputs);
    expect(i.inflationCase).toBe('us-higher');
    const text = stripMarkup(i.directionMessage);
    expect(text).toContain('US expected inflation (3.00%) exceeds Malaysian expected inflation (2.50%) by 0.50 pp');
    expect(text).toContain('lower MYR/USD');
    expect(text).toContain('from 4.4000 to 4.3786 MYR/USD');
    expect(text).toContain('a 0.4854% decrease in MYR per USD');
    expect(text).toContain('MYR appreciates');
    expect(text).toContain("the MYR's value in USD rises by 0.4878%");
    expect(i.costSentence).toContain('USD 1 costs RM 4.3786 instead of RM 4.4000');
  });

  it('T4 d > 0 (Malaysian inflation higher): message says MYR depreciates', () => {
    const i = run(PRESETS.D.inputs);
    expect(i.inflationCase).toBe('my-higher');
    const text = stripMarkup(i.directionMessage);
    expect(text).toContain('higher MYR/USD');
    expect(text).toContain('MYR depreciates');
    expect(text).toContain('from 4.4000 to 4.5073 MYR/USD');
    expect(text).toContain('a 2.4390% increase in MYR per USD');
    expect(text).toContain("the MYR's value in USD falls by 2.3810%");
    expect(text).not.toContain('MYR appreciates');
    expect(i.headline).toMatch(/MYR depreciates/);
  });

  it('|d| ≤ ε (equal inflation): no PPP-based change', () => {
    const i = run(PRESETS.C.inputs);
    expect(i.inflationCase).toBe('equal');
    expect(stripMarkup(i.directionMessage)).toContain('no PPP-based change');
    expect(i.headline).toBe('No PPP-implied change in MYR/USD');
  });

  it('uses unrounded inputs with ε tolerance for the direction', () => {
    // 2.5 vs 2.5000000000001 differ by 1e-15 in decimal terms: within ε → equal.
    const tiny = run({ ...PRESETS.C.inputs, usInflationPct: 2.5000000000001 });
    expect(tiny.inflationCase).toBe('equal');
    // A 0.0001 pp difference is real even though 4-dp displays look alike.
    const small = run({ ...PRESETS.C.inputs, usInflationPct: 2.5001 });
    expect(small.inflationCase).toBe('us-higher');
  });

  it('core mode: equal-real-rate message (same number, different economic objects)', () => {
    const i = run(PRESETS.A.inputs);
    expect(stripMarkup(i.parityMessage)).toContain('Under equal real-rate assumptions');
    expect(stripMarkup(i.parityMessage)).toContain('different economic objects');
  });

  it('advanced mode with r_MY ≠ r_US: explains the separation with the ratio', () => {
    const i = run(PRESETS.ADV.inputs);
    expect(i.parityMessage).toContain('PPP and the covered forward differ because assumed real rates are unequal');
    expect(i.parityMessage).toContain('F/S_PPP = (1 + r_MY)/(1 + r_US) = 1.015/1.025 = 0.9902439024');
    expect(i.parityMessage).toContain('0.0427 MYR/USD below');
  });

  it('advanced mode with equal real rates falls back to the core message', () => {
    const i = run({ ...PRESETS.ADV.inputs, usRealRatePct: 1.5 });
    expect(stripMarkup(i.parityMessage)).toContain('Under equal real-rate assumptions');
  });

  it('Scenario B carries the Fed-reaction caveat; baseline does not', () => {
    expect(run(PRESETS.B.inputs).caveat).toBe(SCENARIO_B_CAVEAT);
    expect(run(PRESETS.A.inputs).caveat).toBeNull();
    expect(run(PRESETS.D.inputs).caveat).toBeNull();
  });

  it('always includes the footer and the "cannot claim" list', () => {
    const i = run(PRESETS.E.inputs);
    expect(i.footer).toBe('These are hypothetical parity implications, not observed market rates.');
    expect(i.cannotClaim.length).toBeGreaterThanOrEqual(4);
  });
});

describe('approxVerdict', () => {
  it('Scenario B: approximation overstates the fall by 0.1190 pp', () => {
    expect(approxVerdict(calculate(PRESETS.B.inputs))).toBe('The approximation overstates the fall in MYR/USD by 0.1190 pp.');
  });
  it('Scenario C: approximation and exact agree', () => {
    expect(approxVerdict(calculate(PRESETS.C.inputs))).toBe('Here the approximation and the exact formula agree.');
  });
  it('Scenario D: approximation overstates the rise', () => {
    expect(approxVerdict(calculate(PRESETS.D.inputs))).toMatch(/overstates the rise/);
  });
});

describe('changesVsBaseline', () => {
  it('Scenario B changes only US inflation', () => {
    const { changed, held } = changesVsBaseline(PRESETS.B.inputs);
    expect(changed).toEqual(['US expected inflation: 3.00% → 5.00%']);
    expect(held.join(' | ')).toContain('Malaysia expected inflation 2.50%');
    expect(held.join(' | ')).toContain('Common real rate 1.50%');
    expect(held.join(' | ')).toContain('Spot S₀ 4.4000 MYR/USD');
  });
  it('baseline changes nothing', () => {
    expect(changesVsBaseline(PRESETS.A.inputs).changed).toEqual([]);
  });
  it('advanced preset reports the US real-rate change', () => {
    expect(changesVsBaseline(PRESETS.ADV.inputs).changed).toEqual(['US real rate: 1.50% → 2.50%']);
  });
});

describe('v2 short copy helpers', () => {
  const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

  it('oneLineSummary picks the direction from unrounded inputs and stays within 20 words', () => {
    expect(oneLineSummary(calculate(PRESETS.A.inputs))).toBe('US inflation is higher, so the model expects a stronger ringgit.');
    expect(oneLineSummary(calculate(PRESETS.D.inputs))).toMatch(/expects a weaker ringgit/);
    expect(oneLineSummary(calculate(PRESETS.C.inputs))).toMatch(/no change in the ringgit/);
    for (const p of Object.values(PRESETS)) expect(words(oneLineSummary(calculate(p.inputs)))).toBeLessThanOrEqual(20);
  });

  it('directionWords gives plain words for each direction', () => {
    expect(directionWords('appreciates')).toBe('Ringgit stronger');
    expect(directionWords('depreciates')).toBe('Ringgit weaker');
    expect(directionWords('unchanged')).toBe('No change');
  });

  it("the short callout appears only when US inflation exceeds Malaysia's by at least 1 pp", () => {
    expect(words(SPIKE_CALLOUT)).toBeLessThanOrEqual(12);
    expect(shouldShowSpikeCallout(PRESETS.B.inputs)).toBe(true);
    expect(shouldShowSpikeCallout(PRESETS.F.inputs)).toBe(true);
    expect(shouldShowSpikeCallout({ ...PRESETS.A.inputs, usInflationPct: 3.5 })).toBe(true);
    expect(shouldShowSpikeCallout(PRESETS.A.inputs)).toBe(false);
    expect(shouldShowSpikeCallout({ ...PRESETS.A.inputs, usInflationPct: 3.49 })).toBe(false);
    expect(shouldShowSpikeCallout(PRESETS.D.inputs)).toBe(false);
  });
});
