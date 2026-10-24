/**
 * Input parsing and validation. Users type percentages as numbers (2.5 = 2.5%).
 * Nothing here rounds: a valid value is passed to the engine exactly as typed.
 */
import type { Inputs } from './finance';

export type FieldKey = 'myInflation' | 'usInflation' | 'realRate' | 'myRealRate' | 'usRealRate' | 'spot';

/** Raw text exactly as typed in the UI (or produced by a preset/slider). */
export type RawInputs = {
  myInflation: string;
  usInflation: string;
  realRate: string;
  myRealRate: string;
  usRealRate: string;
  spot: string;
  advanced: boolean;
};

export type FieldSpec = {
  label: string;
  shortLabel: string;
  min: number;
  max: number;
  /** Slider step; the numeric field accepts any precision. */
  step: number;
  unit: '%' | 'MYR/USD';
  kind: 'rate' | 'spot';
};

export const FIELD_SPECS: Record<FieldKey, FieldSpec> = {
  myInflation: {
    label: 'Malaysia — expected inflation assumption',
    shortLabel: 'π_MY',
    min: -5,
    max: 15,
    step: 0.1,
    unit: '%',
    kind: 'rate',
  },
  usInflation: {
    label: 'United States — expected inflation assumption',
    shortLabel: 'π_US',
    min: -5,
    max: 15,
    step: 0.1,
    unit: '%',
    kind: 'rate',
  },
  realRate: {
    label: 'Common real interest rate (both countries)',
    shortLabel: 'r',
    min: -3,
    max: 10,
    step: 0.1,
    unit: '%',
    kind: 'rate',
  },
  myRealRate: {
    label: 'Malaysia — real interest rate',
    shortLabel: 'r_MY',
    min: -3,
    max: 10,
    step: 0.1,
    unit: '%',
    kind: 'rate',
  },
  usRealRate: {
    label: 'United States — real interest rate',
    shortLabel: 'r_US',
    min: -3,
    max: 10,
    step: 0.1,
    unit: '%',
    kind: 'rate',
  },
  spot: {
    label: 'Spot rate S₀ (hypothetical, not a live quote)',
    shortLabel: 'S₀',
    min: 0.1,
    max: 20,
    step: 0.01,
    unit: 'MYR/USD',
    kind: 'spot',
  },
};

/** Fields that feed the engine in each mode. */
export function activeFields(advanced: boolean): FieldKey[] {
  return advanced
    ? ['myInflation', 'usInflation', 'myRealRate', 'usRealRate', 'spot']
    : ['myInflation', 'usInflation', 'realRate', 'spot'];
}

const NUMBER_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

export type ParseResult = { ok: true; value: number } | { ok: false; reason: 'empty' | 'not-a-number' | 'not-finite' };

/** Parse typed text (or a number) without any rounding. Accepts the Unicode minus sign. */
export function parseNumber(raw: string | number): ParseResult {
  if (typeof raw === 'number') {
    if (Number.isNaN(raw)) return { ok: false, reason: 'not-a-number' };
    if (!Number.isFinite(raw)) return { ok: false, reason: 'not-finite' };
    return { ok: true, value: raw };
  }
  const text = raw.trim().replace(/−/g, '-');
  if (text === '') return { ok: false, reason: 'empty' };
  if (/^[+-]?(infinity|inf)$/i.test(text)) return { ok: false, reason: 'not-finite' };
  if (!NUMBER_PATTERN.test(text)) return { ok: false, reason: 'not-a-number' };
  const value = Number(text);
  if (Number.isNaN(value)) return { ok: false, reason: 'not-a-number' };
  if (!Number.isFinite(value)) return { ok: false, reason: 'not-finite' };
  return { ok: true, value };
}

function fmtBound(n: number, kind: FieldSpec['kind']): string {
  const text = kind === 'spot' ? n.toFixed(2) : String(n);
  return text.replace('-', '−');
}

/** Returns a learner-friendly error message, or null when the value is valid. */
export function validateField(key: FieldKey, raw: string | number): string | null {
  const spec = FIELD_SPECS[key];
  const parsed = parseNumber(raw);
  if (!parsed.ok) {
    if (parsed.reason === 'empty') return 'Enter a number.';
    if (parsed.reason === 'not-finite') return 'Enter a finite number.';
    return spec.kind === 'spot'
      ? 'Not a number. Type digits only, e.g. 4.4000.'
      : 'Not a number. Type digits only, e.g. 2.5 for 2.5%.';
  }
  const v = parsed.value;
  if (spec.kind === 'spot' && v <= 0) return 'Spot rate must be greater than 0 MYR/USD.';
  if (spec.kind === 'rate' && v <= -100) return 'Rate must be greater than −100%.';
  if (v < spec.min || v > spec.max) {
    return spec.kind === 'spot'
      ? `Enter a spot rate between ${fmtBound(spec.min, 'spot')} and ${fmtBound(spec.max, 'spot')} MYR/USD.`
      : `Enter a value between ${fmtBound(spec.min, 'rate')}% and ${fmtBound(spec.max, 'rate')}%.`;
  }
  return null;
}

export type FieldErrors = Partial<Record<FieldKey, string>>;

export type ValidationResult = { ok: true; inputs: Inputs } | { ok: false; errors: FieldErrors };

/** Validate the fields active in the current mode; returns engine inputs only if all are valid. */
export function validateInputs(raw: RawInputs): ValidationResult {
  const errors: FieldErrors = {};
  const values: Partial<Record<FieldKey, number>> = {};
  for (const key of activeFields(raw.advanced)) {
    const message = validateField(key, raw[key]);
    if (message) {
      errors[key] = message;
    } else {
      const parsed = parseNumber(raw[key]);
      if (parsed.ok) values[key] = parsed.value;
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const inputs: Inputs = raw.advanced
    ? {
        myInflationPct: values.myInflation!,
        usInflationPct: values.usInflation!,
        // In advanced mode the shared rate is not used; keep r_MY as a harmless placeholder.
        realRatePct: values.myRealRate!,
        myRealRatePct: values.myRealRate!,
        usRealRatePct: values.usRealRate!,
        spotMyrPerUsd: values.spot!,
        advanced: true,
      }
    : {
        myInflationPct: values.myInflation!,
        usInflationPct: values.usInflation!,
        realRatePct: values.realRate!,
        spotMyrPerUsd: values.spot!,
        advanced: false,
      };
  return { ok: true, inputs };
}

/** Validate already-numeric inputs (e.g. presets or tests that pass NaN directly). */
export function validateNumericInputs(x: Inputs): ValidationResult {
  return validateInputs(inputsToRaw(x));
}

/** Text for a numeric value placed into an input field — no rounding. */
export function numberToFieldText(n: number): string {
  return String(n);
}

/** Spot is shown with 4 dp when that is lossless (4.4 → "4.4000"), otherwise verbatim. */
export function spotToFieldText(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const fixed = n.toFixed(4);
  return Number(fixed) === n ? fixed : String(n);
}

export function inputsToRaw(x: Inputs): RawInputs {
  const myReal = x.myRealRatePct ?? x.realRatePct;
  const usReal = x.usRealRatePct ?? x.realRatePct;
  return {
    myInflation: numberToFieldText(x.myInflationPct),
    usInflation: numberToFieldText(x.usInflationPct),
    realRate: numberToFieldText(x.realRatePct),
    myRealRate: numberToFieldText(myReal),
    usRealRate: numberToFieldText(usReal),
    spot: spotToFieldText(x.spotMyrPerUsd),
    advanced: x.advanced,
  };
}
