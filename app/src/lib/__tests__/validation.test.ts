import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate';
import { inputsToRaw, parseNumber, validateField, validateInputs, validateNumericInputs, type RawInputs } from '../validation';
import { PRESETS } from '../scenarios';

const baseRaw: RawInputs = inputsToRaw(PRESETS.A.inputs);

function withField(patch: Partial<RawInputs>): RawInputs {
  return { ...baseRaw, ...patch };
}

describe('parseNumber', () => {
  it('accepts plain, signed, decimal and Unicode-minus numbers without rounding', () => {
    expect(parseNumber('2.5')).toEqual({ ok: true, value: 2.5 });
    expect(parseNumber(' -1.25 ')).toEqual({ ok: true, value: -1.25 });
    expect(parseNumber('−2')).toEqual({ ok: true, value: -2 });
    expect(parseNumber('.5')).toEqual({ ok: true, value: 0.5 });
    expect(parseNumber('2.123456789')).toEqual({ ok: true, value: 2.123456789 });
  });
  it('rejects empty, non-numeric and non-finite text', () => {
    expect(parseNumber('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseNumber('abc')).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseNumber('2,5')).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseNumber('1.2.3')).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseNumber('NaN')).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseNumber('Infinity')).toEqual({ ok: false, reason: 'not-finite' });
    expect(parseNumber(Number.NaN)).toEqual({ ok: false, reason: 'not-a-number' });
    expect(parseNumber(Number.NEGATIVE_INFINITY)).toEqual({ ok: false, reason: 'not-finite' });
  });
});

describe('T8 edge cases → validation errors and no results', () => {
  const cases: [string, Partial<RawInputs>, keyof RawInputs][] = [
    ['S0 = 0', { spot: '0' }, 'spot'],
    ['negative S0', { spot: '-4.4' }, 'spot'],
    ['NaN spot', { spot: 'NaN' }, 'spot'],
    ['"abc" inflation', { myInflation: 'abc' }, 'myInflation'],
    ['empty inflation', { usInflation: '' }, 'usInflation'],
    ['inflation ≤ −100%', { usInflation: '-100' }, 'usInflation'],
    ['real rate ≤ −100%', { realRate: '-150' }, 'realRate'],
    ['inflation above range', { myInflation: '15.01' }, 'myInflation'],
    ['inflation below range', { usInflation: '-5.5' }, 'usInflation'],
    ['real rate above range', { realRate: '10.5' }, 'realRate'],
    ['spot above range', { spot: '20.5' }, 'spot'],
    ['spot below range', { spot: '0.05' }, 'spot'],
    ['Infinity', { realRate: 'Infinity' }, 'realRate'],
  ];
  for (const [name, patch, field] of cases) {
    it(name, () => {
      const result = evaluate(withField(patch));
      expect(result.ok).toBe(false);
      expect(result.results).toBeNull();
      expect(result.errors[field as keyof typeof result.errors]).toBeTruthy();
    });
  }

  it('gives specific messages', () => {
    expect(validateField('spot', '0')).toBe('Spot rate must be greater than 0 MYR/USD.');
    expect(validateField('usInflation', '-100')).toBe('Rate must be greater than −100%.');
    expect(validateField('myInflation', 'abc')).toMatch(/Not a number/);
    expect(validateField('myInflation', '16')).toBe('Enter a value between −5% and 15%.');
    expect(validateField('spot', '25')).toBe('Enter a spot rate between 0.10 and 20.00 MYR/USD.');
  });

  it('numeric inputs (NaN, Infinity) are rejected too', () => {
    expect(validateNumericInputs({ ...PRESETS.A.inputs, spotMyrPerUsd: Number.NaN }).ok).toBe(false);
    expect(validateNumericInputs({ ...PRESETS.A.inputs, myInflationPct: Number.POSITIVE_INFINITY }).ok).toBe(false);
  });

  it('range boundaries are inclusive', () => {
    expect(validateField('myInflation', '-5')).toBeNull();
    expect(validateField('myInflation', '15')).toBeNull();
    expect(validateField('realRate', '-3')).toBeNull();
    expect(validateField('realRate', '10')).toBeNull();
    expect(validateField('spot', '0.1')).toBeNull();
    expect(validateField('spot', '20')).toBeNull();
  });
});

describe('validateInputs', () => {
  it('passes valid baseline text through exactly', () => {
    const v = validateInputs(baseRaw);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.inputs).toEqual(PRESETS.A.inputs);
  });

  it('keeps finer-than-slider precision (no rounding)', () => {
    const v = validateInputs(withField({ myInflation: '2.123456' }));
    expect(v.ok && v.inputs.myInflationPct).toBe(2.123456);
  });

  it('only validates fields active in the current mode', () => {
    // An invalid advanced-only field is ignored in core mode...
    expect(validateInputs(withField({ usRealRate: 'abc' })).ok).toBe(true);
    // ...but rejected once advanced mode is on.
    const adv = validateInputs(withField({ usRealRate: 'abc', advanced: true }));
    expect(adv.ok).toBe(false);
    // The shared rate is ignored in advanced mode.
    expect(validateInputs(withField({ realRate: 'abc', advanced: true })).ok).toBe(true);
  });

  it('round-trips the advanced preset', () => {
    const v = validateInputs(inputsToRaw(PRESETS.ADV.inputs));
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.inputs.myRealRatePct).toBe(1.5);
      expect(v.inputs.usRealRatePct).toBe(2.5);
      expect(v.inputs.advanced).toBe(true);
    }
  });

  it('formats the preset spot as 4.4000 without changing its value', () => {
    expect(baseRaw.spot).toBe('4.4000');
    expect(inputsToRaw({ ...PRESETS.A.inputs, spotMyrPerUsd: 4.123456 }).spot).toBe('4.123456');
  });
});
