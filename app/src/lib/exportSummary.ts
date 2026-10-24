/**
 * Local-only exports: a plain-text summary for the clipboard and a CSV of the
 * A vs B comparison. No network calls. Every export carries the disclaimer.
 */
import type { Inputs, Results } from './finance';
import { compareInputs, compareResults, type MetricKind } from './comparison';
import {
  csvNumber,
  formatInputPct,
  formatPctChange,
  formatPp,
  formatRate,
  formatSpotUnit,
  formatDecimal,
  formatSpotChange,
} from './format';
import { DISCLAIMER, FOOTER_NOTE, interpret, stripMarkup } from './interpretation';

export type NamedScenario = { label: string; inputs: Inputs; results: Results };

const QUOTE_RULE = 'Quotation: S = MYR per 1 USD (MYR/USD). Higher S = MYR weaker; lower S = MYR stronger.';
const HORIZON = 'Horizon: 1 year; annual effective rates; no transaction costs or risk premia.';

export const FORMULA_LINES: string[] = [
  'Fisher (exact):  i = (1 + r)(1 + π) − 1      [approx: i ≈ r + π]',
  'Relative PPP:    S_PPP = S0 × (1 + π_MY) / (1 + π_US)',
  'Quote change:    100 × (S_PPP / S0 − 1)      [approx: (π_MY − π_US) × 100]',
  'MYR value change in USD terms: 100 × (S0 / S_PPP − 1)',
  'Covered IRP:     F_CIP = S0 × (1 + i_MY) / (1 + i_US)',
  'IFE expected spot: S0 × (1 + i_MY) / (1 + i_US)  (same algebra as CIP, different meaning)',
];

function directionWord(r: Results): string {
  switch (r.myrDirection) {
    case 'appreciates':
      return 'MYR appreciates (MYR/USD falls ↓)';
    case 'depreciates':
      return 'MYR depreciates (MYR/USD rises ↑)';
    case 'unchanged':
      return 'Unchanged (no PPP-implied move)';
  }
}

function inputLines(x: Inputs): string[] {
  const lines = [
    `Malaysia expected inflation assumption: ${formatInputPct(x.myInflationPct)}`,
    `US expected inflation assumption: ${formatInputPct(x.usInflationPct)}`,
  ];
  if (x.advanced) {
    lines.push(
      `Malaysia real rate (advanced mode): ${formatInputPct(x.myRealRatePct ?? x.realRatePct)}`,
      `US real rate (advanced mode): ${formatInputPct(x.usRealRatePct ?? x.realRatePct)}`,
    );
  } else {
    lines.push(`Common real interest rate: ${formatInputPct(x.realRatePct)}`);
  }
  lines.push(`Spot rate S0 (hypothetical, not a live quote): ${formatSpotUnit(x.spotMyrPerUsd)}`);
  return lines;
}

function outputLines(r: Results): string[] {
  return [
    `Malaysia Fisher-implied nominal rate: ${formatRate(r.nominalMYPct)} (approx r + π: ${formatRate(r.nominalMYApproxPct)})`,
    `US Fisher-implied nominal rate: ${formatRate(r.nominalUSPct)} (approx r + π: ${formatRate(r.nominalUSApproxPct)})`,
    `Nominal differential i_MY − i_US: ${formatPp(r.nominalDiffPp)}`,
    `PPP-implied future spot (model scenario, long-run benchmark): ${formatSpotUnit(r.pppSpot)}`,
    `PPP change in MYR/USD quote: ${formatPctChange(r.quoteChangePct)} (approx: ${formatPctChange(r.quoteChangeApproxPct)}; approx − exact = ${formatPp(r.approxErrorPp)})`,
    `MYR value change in USD terms: ${formatPctChange(r.myrValueChangePct)}`,
    `MYR direction: ${directionWord(r)}`,
    `Theoretical covered-IRP forward: ${formatSpotUnit(r.cipForward)} (USD forward ${r.usdForwardPremiumPct < 0 ? 'discount' : 'premium'} ${formatPctChange(r.usdForwardPremiumPct)})`,
    `IFE expected spot (not a contract price): ${formatSpotUnit(r.ifeSpot)}`,
    r.parityMatch
      ? 'Parity status: PPP spot = CIP forward (equal real rates)'
      : `Parity status: PPP and CIP differ by ${formatSpotChange(r.parityGap)} because real rates differ (F/S_PPP = ${formatDecimal(r.realRateRatio)})`,
  ];
}

function indent(lines: string[]): string[] {
  return lines.map((l) => `  ${l}`);
}

export function scenarioSummaryText(s: NamedScenario): string {
  const why = interpret(s.inputs, s.results);
  return [
    `ParityLab — scenario summary: ${s.label}`,
    DISCLAIMER,
    QUOTE_RULE,
    HORIZON,
    '',
    'INPUTS (hypothetical assumptions)',
    ...indent(inputLines(s.inputs)),
    '',
    'OUTPUTS (model-implied, unrounded internally; shown to 4 dp)',
    ...indent(outputLines(s.results)),
    '',
    'FORMULAS',
    ...indent(FORMULA_LINES),
    '',
    'INTERPRETATION',
    ...indent([stripMarkup(why.directionMessage), stripMarkup(why.parityMessage), ...(why.caveat ? [why.caveat] : [])]),
    '',
    FOOTER_NOTE,
  ].join('\n');
}

function changeText(kind: MetricKind | 'rate-input' | 'spot-input', change: number): string {
  if (kind === 'spot' || kind === 'spot-input') return formatSpotChange(change);
  return formatPp(change);
}

export function comparisonSummaryText(a: NamedScenario, b: NamedScenario): string {
  const inputRows = compareInputs(a.inputs, b.inputs);
  const metricRows = compareResults(a.results, b.results);
  const fmtLevel = (kind: MetricKind, v: number) =>
    kind === 'spot' ? formatSpotUnit(v) : kind === 'rate' ? formatRate(v) : kind === 'pp' ? formatPp(v) : formatPctChange(v);
  const why = interpret(b.inputs, b.results);
  return [
    `ParityLab — comparison summary: Scenario A (${a.label}) vs Scenario B (${b.label})`,
    DISCLAIMER,
    QUOTE_RULE,
    HORIZON,
    '',
    'ASSUMPTIONS (A → B)',
    ...indent(
      inputRows.map((row) => {
        const fa = row.kind === 'spot' ? formatSpotUnit(row.a) : formatInputPct(row.a);
        const fb = row.kind === 'spot' ? formatSpotUnit(row.b) : formatInputPct(row.b);
        return `${row.label}: ${fa} → ${fb}${row.changed ? ` (changed by ${changeText(row.kind === 'spot' ? 'spot-input' : 'rate-input', row.change)})` : ' (held constant)'}`;
      }),
    ),
    '',
    'OUTPUTS (A → B; change B − A)',
    ...indent(
      metricRows.map(
        (row) =>
          `${row.label}: ${fmtLevel(row.kind, row.a)} → ${fmtLevel(row.kind, row.b)}; change ${changeText(row.kind, row.change)}` +
          (row.pctChange === null ? '' : ` (${formatPctChange(row.pctChange)} vs A)`),
      ),
    ),
    `  MYR direction: A ${directionWord(a.results)}; B ${directionWord(b.results)}`,
    '',
    'FORMULAS',
    ...indent(FORMULA_LINES),
    '',
    'INTERPRETATION OF SCENARIO B',
    ...indent([stripMarkup(why.directionMessage), stripMarkup(why.parityMessage), ...(why.caveat ? [why.caveat] : [])]),
    '',
    FOOTER_NOTE,
  ].join('\n');
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(',');
}

const KIND_UNIT: Record<MetricKind, { level: string; change: string }> = {
  rate: { level: '%', change: 'pp' },
  pp: { level: 'pp', change: 'pp' },
  'pct-change': { level: '%', change: 'pp' },
  spot: { level: 'MYR/USD', change: 'MYR/USD' },
};

/** CSV of the comparison with full-precision (10 dp) numbers and the disclaimer. */
export function comparisonCsv(a: NamedScenario, b: NamedScenario): string {
  const header = ['Section', 'Item', 'Unit', `Scenario A (${a.label})`, `Scenario B (${b.label})`, 'Change (B - A)', 'Change unit', '% change vs A'];
  const rows: string[][] = [];
  for (const row of compareInputs(a.inputs, b.inputs)) {
    const unit = row.kind === 'spot' ? 'MYR/USD' : '%';
    rows.push([
      'Assumption',
      row.label,
      unit,
      csvNumber(row.a),
      csvNumber(row.b),
      csvNumber(row.change),
      row.kind === 'spot' ? 'MYR/USD' : 'pp',
      '',
    ]);
  }
  for (const row of compareResults(a.results, b.results)) {
    const unit = KIND_UNIT[row.kind];
    rows.push([
      'Output',
      row.label,
      unit.level,
      csvNumber(row.a),
      csvNumber(row.b),
      csvNumber(row.change),
      unit.change,
      row.pctChange === null ? '' : csvNumber(row.pctChange),
    ]);
  }
  rows.push(['Output', 'MYR direction (PPP)', '', a.results.myrDirection, b.results.myrDirection, '', '', '']);

  return [
    csvRow(['ParityLab comparison export']),
    csvRow([DISCLAIMER]),
    csvRow([QUOTE_RULE]),
    csvRow([HORIZON]),
    '',
    csvRow(header),
    ...rows.map(csvRow),
    '',
    csvRow([FOOTER_NOTE]),
  ].join('\r\n');
}
