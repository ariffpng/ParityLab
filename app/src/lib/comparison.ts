/**
 * Scenario A vs B comparison. Differences are taken from UNROUNDED engine
 * outputs — never from displayed values.
 */
import type { Inputs, Results } from './finance';

export type MetricKind = 'rate' | 'pp' | 'pct-change' | 'spot';

export type MetricRow = {
  key: keyof Results;
  label: string;
  kind: MetricKind;
  a: number;
  b: number;
  /** b − a (pp for rates and changes; MYR/USD for exchange-rate levels). */
  change: number;
  /** 100 × (b/a − 1) for levels only; null where a relative change is not meaningful. */
  pctChange: number | null;
};

export type InputRow = {
  key: 'myInflation' | 'usInflation' | 'myRealRate' | 'usRealRate' | 'spot';
  label: string;
  kind: 'rate' | 'spot';
  a: number;
  b: number;
  change: number;
  changed: boolean;
};

const METRICS: { key: keyof Results; label: string; kind: MetricKind }[] = [
  { key: 'nominalMYPct', label: 'Malaysia Fisher-implied nominal rate', kind: 'rate' },
  { key: 'nominalUSPct', label: 'US Fisher-implied nominal rate', kind: 'rate' },
  { key: 'nominalDiffPp', label: 'Nominal differential i_MY − i_US', kind: 'pp' },
  { key: 'pppSpot', label: 'PPP-implied future spot', kind: 'spot' },
  { key: 'quoteChangePct', label: 'PPP change in MYR/USD quote', kind: 'pct-change' },
  { key: 'myrValueChangePct', label: 'MYR value change in USD terms', kind: 'pct-change' },
  { key: 'cipForward', label: 'Theoretical covered-IRP forward', kind: 'spot' },
  { key: 'usdForwardPremiumPct', label: 'USD forward premium (+) / discount (−)', kind: 'pct-change' },
  { key: 'ifeSpot', label: 'IFE expected spot', kind: 'spot' },
  { key: 'approxErrorPp', label: 'Approximation error (approx − exact quote change)', kind: 'pp' },
];

function levelPctChange(kind: MetricKind, a: number, b: number): number | null {
  if (kind !== 'rate' && kind !== 'spot') return null;
  if (a === 0) return null;
  return 100 * (b / a - 1);
}

export function compareResults(a: Results, b: Results): MetricRow[] {
  return METRICS.map(({ key, label, kind }) => {
    const va = a[key] as number;
    const vb = b[key] as number;
    return { key, label, kind, a: va, b: vb, change: vb - va, pctChange: levelPctChange(kind, va, vb) };
  });
}

function realRates(x: Inputs): { my: number; us: number } {
  return x.advanced
    ? { my: x.myRealRatePct ?? x.realRatePct, us: x.usRealRatePct ?? x.realRatePct }
    : { my: x.realRatePct, us: x.realRatePct };
}

export function compareInputs(a: Inputs, b: Inputs): InputRow[] {
  const ra = realRates(a);
  const rb = realRates(b);
  const rows: Omit<InputRow, 'change' | 'changed'>[] = [
    { key: 'myInflation', label: 'Malaysia expected inflation assumption', kind: 'rate', a: a.myInflationPct, b: b.myInflationPct },
    { key: 'usInflation', label: 'US expected inflation assumption', kind: 'rate', a: a.usInflationPct, b: b.usInflationPct },
    { key: 'myRealRate', label: 'Malaysia real rate', kind: 'rate', a: ra.my, b: rb.my },
    { key: 'usRealRate', label: 'US real rate', kind: 'rate', a: ra.us, b: rb.us },
    { key: 'spot', label: 'Spot S₀ (hypothetical)', kind: 'spot', a: a.spotMyrPerUsd, b: b.spotMyrPerUsd },
  ];
  return rows.map((row) => ({ ...row, change: row.b - row.a, changed: row.a !== row.b }));
}
