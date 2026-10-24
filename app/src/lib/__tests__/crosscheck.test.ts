/**
 * Cross-check two SEPARATELY implemented calculations: the TypeScript engine vs
 * verification/expected_values.json written by verification/verify_paritylab.py
 * (Python decimal.Decimal, precision 28). Tolerance 1e-9.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculate, type Inputs, type Results } from '../finance';

type PyScenario = Record<string, string>;
type PyFile = {
  scenarios: Record<string, PyScenario>;
  approximation: { B_quote_change_approx_minus_exact_pp: string; A_fisher_approx_pct: string };
  sensitivity: { nominal_pp_per_inflation_pp_at_r_1_5: string };
};

// Vitest runs with the app/ folder as its working directory.
const jsonPath = resolve(process.cwd(), '../verification/expected_values.json');
const py = JSON.parse(readFileSync(jsonPath, 'utf8')) as PyFile;

const TOLERANCE = 1e-9;

/** Python field → TypeScript engine field. */
const FIELD_MAP: [string, keyof Results][] = [
  ['i_my_pct', 'nominalMYPct'],
  ['i_us_pct', 'nominalUSPct'],
  ['i_my_approx_pct', 'nominalMYApproxPct'],
  ['i_us_approx_pct', 'nominalUSApproxPct'],
  ['diff_pp', 'nominalDiffPp'],
  ['ppp_spot', 'pppSpot'],
  ['cip_forward', 'cipForward'],
  ['ife_spot', 'ifeSpot'],
  ['quote_change_pct', 'quoteChangePct'],
  ['quote_change_approx_pct', 'quoteChangeApproxPct'],
  ['myr_value_change_pct', 'myrValueChangePct'],
  ['usd_forward_premium_pct', 'usdForwardPremiumPct'],
  ['real_rate_ratio', 'realRateRatio'],
];

/** Rebuild engine inputs from the Python scenario's own decimal inputs. */
function inputsFrom(s: PyScenario): Inputs {
  const pct = (k: string) => Number(s[k]) * 100;
  const rMY = pct('r_my');
  const rUS = pct('r_us');
  return {
    myInflationPct: pct('pi_my'),
    usInflationPct: pct('pi_us'),
    realRatePct: rMY,
    myRealRatePct: rMY,
    usRealRatePct: rUS,
    spotMyrPerUsd: Number(s.spot),
    advanced: rMY !== rUS,
  };
}

describe('Independent Python (Decimal) vs TypeScript engine', () => {
  it('covers scenarios A–F and the unequal-real-rate diagnostic', () => {
    expect(Object.keys(py.scenarios).sort()).toEqual(
      ['ADV_unequal_real', 'A_baseline', 'B_US_spike', 'C_equal', 'D_MY_higher', 'E_extreme_MY', 'F_extreme_US'].sort(),
    );
  });

  for (const [name, scenario] of Object.entries(py.scenarios)) {
    it(`${name}: every output within 1e-9`, () => {
      const r = calculate(inputsFrom(scenario));
      for (const [pyKey, tsKey] of FIELD_MAP) {
        const expected = Number(scenario[pyKey]);
        const actual = r[tsKey] as number;
        expect(Math.abs(actual - expected), `${name}.${pyKey}`).toBeLessThan(TOLERANCE);
      }
      expect(r.myrDirection).toBe(scenario.direction);
      expect(r.parityMatch).toBe(name !== 'ADV_unequal_real');
    });
  }

  it('approximation error and sensitivity agree', () => {
    const b = calculate(inputsFrom(py.scenarios.B_US_spike));
    expect(Math.abs(b.approxErrorPp - Number(py.approximation.B_quote_change_approx_minus_exact_pp))).toBeLessThan(TOLERANCE);
    const a = calculate(inputsFrom(py.scenarios.A_baseline));
    expect(Math.abs(a.nominalMYApproxPct - Number(py.approximation.A_fisher_approx_pct))).toBeLessThan(TOLERANCE);
    expect(Number(py.sensitivity.nominal_pp_per_inflation_pp_at_r_1_5)).toBeCloseTo(1.015, 12);
  });
});
