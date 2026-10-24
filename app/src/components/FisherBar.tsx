import type { Results } from '../lib/finance';
import { fixed, formatInputPct, formatRate } from '../lib/format';
import { fisherParts } from '../lib/visuals';

type Props = { r: Results; country: 'MY' | 'US'; domain: [number, number] };

const FILL = {
  real: 'var(--color-ink-2)',
  inflation: { MY: 'var(--color-my)', US: 'var(--color-us)' },
  cross: 'var(--color-accent)',
};

/**
 * Fisher stacked bar: real rate + expected inflation + the small cross-term
 * r·π = the nominal rate. Both country bars share one scale (`domain`).
 */
export function FisherBar({ r, country, domain }: Props) {
  const { parts, total } = fisherParts(r, country);
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;
  const [real, inflation, cross] = parts;
  const label = `${country === 'MY' ? 'Malaysia' : 'US'}: real rate ${formatInputPct(real.value)} + expected inflation ${formatInputPct(inflation.value)} + cross-term ${fixed(cross.value, 4)} pp = nominal rate ${formatRate(total)}`;

  return (
    <div>
      <svg
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="block h-4 w-full overflow-visible"
      >
        <rect x="0" y="0" width="100" height="16" rx="3" fill="var(--color-surface-2)" />
        {parts.map((p) => {
          const a = x(Math.min(p.start, p.end));
          const b = x(Math.max(p.start, p.end));
          const fill = p.key === 'inflation' ? FILL.inflation[country] : FILL[p.key];
          return (
            <rect
              key={p.key}
              x={a}
              y={p.key === 'cross' ? 0 : 2}
              width={Math.max(p.key === 'cross' && p.value !== 0 ? 0.8 : 0, b - a)}
              height={p.key === 'cross' ? 16 : 12}
              fill={fill}
              className="transition-all duration-300 ease-out"
            />
          );
        })}
        {lo < 0 && (
          <line
            x1={x(0)}
            x2={x(0)}
            y1="-2"
            y2="18"
            stroke="var(--color-ink)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <ul className="mt-2 grid gap-1 text-sm text-ink-2" aria-hidden="true">
        <li className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-2" />
          <span className="tabular font-semibold text-ink">{formatInputPct(real.value)}</span> real
        </li>
        <li className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className={`h-2.5 w-2.5 rounded-sm ${country === 'MY' ? 'bg-my' : 'bg-us'}`} />
          <span className="tabular font-semibold text-ink">{formatInputPct(inflation.value)}</span> inflation
        </li>
        <li className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
          <span className="tabular font-semibold text-ink">{fixed(cross.value, 4)}</span> r×π
        </li>
      </ul>
    </div>
  );
}
