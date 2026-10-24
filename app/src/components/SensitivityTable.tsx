import { calculate, type Inputs } from '../lib/finance';
import { formatInputPct, formatPctChange, formatPp, formatRate, formatSpot, formatSpotUnit } from '../lib/format';
import { PRESETS, SENSITIVITY_CASES } from '../lib/scenarios';
import { DirectionBadge } from './DirectionBadge';

type Props = {
  /** Optional extra row (Learn More shows the learner's own scenario). */
  extra?: { label: string; inputs: Inputs } | null;
};

/** The six-case sensitivity study A–F, computed live by the engine (never typed in by hand). */
export function SensitivityTable({ extra = null }: Props) {
  const rows = SENSITIVITY_CASES.map((p) => ({
    key: p.id,
    label: `${p.id}. ${p.name}`,
    inputs: p.inputs,
    r: calculate(p.inputs),
  }));
  if (extra) rows.push({ key: 'A', label: extra.label, inputs: extra.inputs, r: calculate(extra.inputs) });
  return (
    <div>
      <p className="text-sm text-ink-2">
        Cases A–F: S₀ = {formatSpotUnit(PRESETS.A.inputs.spotMyrPerUsd)}, common real rate{' '}
        {formatInputPct(PRESETS.A.inputs.realRatePct)}. Every value is calculated in your browser by the same engine as the
        simulator.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table min-w-[60rem]">
          <caption className="sr-only">Sensitivity cases A to F</caption>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col" className="num">
                π_MY
              </th>
              <th scope="col" className="num">
                π_US
              </th>
              <th scope="col" className="num">
                i_MY
              </th>
              <th scope="col" className="num">
                i_US
              </th>
              <th scope="col" className="num">
                i_MY − i_US
              </th>
              <th scope="col" className="num">
                PPP spot
              </th>
              <th scope="col" className="num">
                CIP forward
              </th>
              <th scope="col" className="num">
                Quote change
              </th>
              <th scope="col" className="num">
                MYR value change
              </th>
              <th scope="col">Ringgit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, inputs, r }, k) => (
              <tr key={`${key}-${k}`} className={k === SENSITIVITY_CASES.length ? 'bg-accent-soft' : undefined}>
                <th scope="row">{label}</th>
                <td className="num">{formatInputPct(inputs.myInflationPct)}</td>
                <td className="num">{formatInputPct(inputs.usInflationPct)}</td>
                <td className="num">{formatRate(r.nominalMYPct)}</td>
                <td className="num">{formatRate(r.nominalUSPct)}</td>
                <td className="num">{formatPp(r.nominalDiffPp)}</td>
                <td className="num">{formatSpot(r.pppSpot)} MYR/USD</td>
                <td className="num">{formatSpot(r.cipForward)} MYR/USD</td>
                <td className="num">{formatPctChange(r.quoteChangePct)}</td>
                <td className="num">{formatPctChange(r.myrValueChangePct)}</td>
                <td>
                  <DirectionBadge direction={r.myrDirection} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 rounded-xl bg-surface-2 px-4 py-2 font-semibold text-ink">
        Each row is a separate one-year scenario from the same spot rate, not a time series.
      </p>
    </div>
  );
}
