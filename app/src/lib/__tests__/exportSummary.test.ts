import { describe, expect, it } from 'vitest';
import { calculate } from '../finance';
import { compareInputs, compareResults } from '../comparison';
import { comparisonCsv, comparisonSummaryText, scenarioSummaryText, type NamedScenario } from '../exportSummary';
import { DISCLAIMER } from '../interpretation';
import { PRESETS } from '../scenarios';

const A: NamedScenario = { label: 'Baseline', inputs: PRESETS.A.inputs, results: calculate(PRESETS.A.inputs) };
const B: NamedScenario = { label: 'US inflation spike', inputs: PRESETS.B.inputs, results: calculate(PRESETS.B.inputs) };

describe('T10 disclosure in exports', () => {
  it('the copied scenario summary contains the disclaimer, inputs, outputs and formulas', () => {
    const text = scenarioSummaryText(A);
    expect(text).toContain(DISCLAIMER);
    expect(text).toContain('Illustrative model — not a trading forecast');
    expect(text).toContain('These are hypothetical parity implications, not observed market rates.');
    expect(text).toContain('Spot rate S0 (hypothetical, not a live quote): 4.4000 MYR/USD');
    expect(text).toContain('Malaysia Fisher-implied nominal rate: 4.0375%');
    expect(text).toContain('PPP-implied future spot (model scenario, long-run benchmark): 4.3786 MYR/USD');
    expect(text).toContain('Theoretical covered-IRP forward: 4.3786 MYR/USD');
    expect(text).toContain('S_PPP = S0 × (1 + π_MY) / (1 + π_US)');
    expect(text).not.toContain('**');
  });

  it('the comparison summary contains the disclaimer and both scenarios', () => {
    const text = comparisonSummaryText(A, B);
    expect(text).toContain(DISCLAIMER);
    expect(text).toContain('US expected inflation assumption: 3.00% → 5.00% (changed by +2.0000 pp)');
    expect(text).toContain('PPP-implied future spot: 4.3786 MYR/USD → 4.2952 MYR/USD');
    expect(text).toContain('Fed tightening');
  });

  it('the CSV contains the disclaimer and full-precision values', () => {
    const csv = comparisonCsv(A, B);
    expect(csv).toContain(DISCLAIMER);
    expect(csv).toContain('These are hypothetical parity implications, not observed market rates.');
    expect(csv).toMatch(/Output,PPP-implied future spot,MYR\/USD,4\.3786407767,4\.2952380952,-0\.0834026815,MYR\/USD,-1\.9047619048/);
    expect(csv).toContain('Output,MYR direction (PPP),,appreciates,appreciates');
  });
});

describe('comparison', () => {
  it('reports changed vs held-constant assumptions', () => {
    const rows = compareInputs(A.inputs, B.inputs);
    expect(rows.filter((r) => r.changed).map((r) => r.key)).toEqual(['usInflation']);
  });
  it('gives % change only for levels', () => {
    const rows = compareResults(A.results, B.results);
    const us = rows.find((r) => r.key === 'nominalUSPct')!;
    expect(us.change).toBeCloseTo(2.03, 9);
    expect(us.pctChange).toBeCloseTo((6.575 / 4.545 - 1) * 100, 9);
    expect(rows.find((r) => r.key === 'quoteChangePct')!.pctChange).toBeNull();
    expect(rows.find((r) => r.key === 'nominalDiffPp')!.pctChange).toBeNull();
  });
});
