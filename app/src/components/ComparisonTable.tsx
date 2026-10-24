import { compareInputs, compareResults, type MetricKind } from '../lib/comparison';
import type { NamedScenario } from '../lib/exportSummary';
import { formatInputPct, formatPctChange, formatPp, formatRate, formatSpotChange, formatSpotUnit } from '../lib/format';
import { DirectionBadge } from './DirectionBadge';

function levelText(kind: MetricKind, v: number): string {
  switch (kind) {
    case 'spot':
      return formatSpotUnit(v);
    case 'rate':
      return formatRate(v);
    case 'pp':
      return formatPp(v);
    case 'pct-change':
      return formatPctChange(v);
  }
}

/** Compare: the four rows most learners need. "Show all rows" expands to the full table. */
export function SimpleCompareTable({ a, b }: { a: NamedScenario; b: NamedScenario }) {
  const rows = [
    {
      label: 'Malaysia rate',
      a: formatRate(a.results.nominalMYPct),
      b: formatRate(b.results.nominalMYPct),
      change: formatPp(b.results.nominalMYPct - a.results.nominalMYPct),
    },
    {
      label: 'US rate',
      a: formatRate(a.results.nominalUSPct),
      b: formatRate(b.results.nominalUSPct),
      change: formatPp(b.results.nominalUSPct - a.results.nominalUSPct),
    },
    {
      label: 'PPP future rate',
      a: formatSpotUnit(a.results.pppSpot),
      b: formatSpotUnit(b.results.pppSpot),
      change: formatSpotChange(b.results.pppSpot - a.results.pppSpot),
    },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[36rem]" aria-label="Scenario A vs Scenario B: key results">
        <thead>
          <tr>
            <th scope="col">Result</th>
            <th scope="col" className="num">
              A · {a.label}
            </th>
            <th scope="col" className="num">
              B · {b.label}
            </th>
            <th scope="col" className="num">
              Change (B − A)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="font-semibold">
                {row.label}
              </th>
              <td className="num">{row.a}</td>
              <td className="num font-semibold">{row.b}</td>
              <td className="num">{row.change}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="font-semibold">
              Ringgit direction
            </th>
            <td className="num">
              <DirectionBadge direction={a.results.myrDirection} />
            </td>
            <td className="num">
              <DirectionBadge direction={b.results.myrDirection} />
            </td>
            <td className="num">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** The full v1 comparison: every assumption and output, with absolute and % changes. */
export function ComparisonTable({ a, b }: { a: NamedScenario; b: NamedScenario }) {
  const inputs = compareInputs(a.inputs, b.inputs);
  const outputs = compareResults(a.results, b.results);
  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[45rem]">
        <caption className="sr-only">Scenario A vs Scenario B: assumptions and outputs</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="num">
              Scenario A
            </th>
            <th scope="col" className="num">
              Scenario B
            </th>
            <th scope="col" className="num">
              Change (B − A)
            </th>
            <th scope="col" className="num">
              % change vs A
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="rowgroup" colSpan={5} className="bg-surface-2 text-sm font-bold text-ink">
              Assumptions
            </th>
          </tr>
          {inputs.map((row) => (
            <tr key={row.key} className={row.changed ? 'bg-notice-soft' : undefined}>
              <th scope="row" className="min-w-[15rem] font-normal">
                {row.label}
                <span className="tag ml-2">{row.changed ? 'changed' : 'held constant'}</span>
              </th>
              <td className="num">{row.kind === 'spot' ? formatSpotUnit(row.a) : formatInputPct(row.a)}</td>
              <td className="num">{row.kind === 'spot' ? formatSpotUnit(row.b) : formatInputPct(row.b)}</td>
              <td className="num">{row.kind === 'spot' ? formatSpotChange(row.change) : formatPp(row.change)}</td>
              <td className="num">—</td>
            </tr>
          ))}
          <tr>
            <th scope="rowgroup" colSpan={5} className="bg-surface-2 text-sm font-bold text-ink">
              Outputs (model-implied)
            </th>
          </tr>
          {outputs.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="min-w-[15rem] font-normal">
                {row.label}
              </th>
              <td className="num">{levelText(row.kind, row.a)}</td>
              <td className="num">{levelText(row.kind, row.b)}</td>
              <td className="num">{row.kind === 'spot' ? formatSpotChange(row.change) : formatPp(row.change)}</td>
              <td className="num">{row.pctChange === null ? '—' : formatPctChange(row.pctChange)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="font-normal">
              MYR direction (PPP)
            </th>
            <td className="num">
              <DirectionBadge direction={a.results.myrDirection} />
            </td>
            <td className="num">
              <DirectionBadge direction={b.results.myrDirection} />
            </td>
            <td className="num">—</td>
            <td className="num">—</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-sm text-ink-2">
        Changes are computed from unrounded values. Rate rows change in percentage points (pp); exchange-rate rows in MYR/USD. “%
        change vs A” is shown only for levels — for rows that are already changes or differences it would not be meaningful.
      </p>
    </div>
  );
}
