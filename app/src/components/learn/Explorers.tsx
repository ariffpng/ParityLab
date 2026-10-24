import { useState, type CSSProperties } from 'react';
import { calculate, fisherApprox, fisherNominal, pctChange, type MyrDirection, type Results } from '../../lib/finance';
import { fixed, formatInputPct, formatMoney, formatPctChange, formatPp, formatRate, formatSpot } from '../../lib/format';
import { approxVsExact, fisherDomain } from '../../lib/visuals';
import { DirectionBadge } from '../DirectionBadge';
import { FisherBar } from '../FisherBar';
import { Stack } from '../Stack';
import { TweenNumber } from '../TweenNumber';

/** A labelled local slider for the Learn More explorers (does not change the simulator). */
function LocalSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-4 text-base font-semibold text-ink">
        {label}
        <span className="tabular text-lg">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` } as CSSProperties}
      />
    </label>
  );
}

/* ---------- Reading exchange rates ---------- */

/** Drag a hypothetical future MYR/USD and read it both ways round. */
export function RateExplorer({ spot, start }: { spot: number; start: number }) {
  const [rate, setRate] = useState(Math.round(start * 100) / 100);
  const direction: MyrDirection = rate < spot ? 'appreciates' : rate > spot ? 'depreciates' : 'unchanged';
  const lo = Math.max(0.1, spot * 0.8);
  const hi = spot * 1.2;
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div>
      <LocalSlider
        label="Try a future MYR/USD"
        value={rate}
        min={Number(lo.toFixed(2))}
        max={Number(hi.toFixed(2))}
        step={0.01}
        onChange={setRate}
        format={(v) => `${formatSpot(v)} MYR/USD`}
      />
      <div className="relative mt-6 h-12" aria-hidden="true">
        <div className="absolute inset-x-0 top-5 h-2 rounded-full bg-[linear-gradient(to_right,var(--color-up),var(--color-flat-soft)_50%,var(--color-down))]" />
        <span className="absolute top-0 h-12 w-0.5 bg-ink" style={{ left: `${x(spot)}%` }} />
        <span
          className="absolute top-2 h-8 w-8 -translate-x-1/2 rounded-full border-4 border-ink bg-accent transition-[left] duration-300"
          style={{ left: `${x(rate)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-sm font-semibold">
        <span className="text-up-ink">← Ringgit stronger</span>
        <span className="text-ink-2">today {formatSpot(spot)}</span>
        <span className="text-down-ink">Ringgit weaker →</span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <p className="rounded-xl bg-surface-2 p-4 text-lg text-ink">
          US$1 costs <strong className="tabular">{formatMoney('RM', rate)}</strong>
          <span className="block text-sm text-ink-2">today {formatMoney('RM', spot)}</span>
        </p>
        <p className="rounded-xl bg-surface-2 p-4 text-lg text-ink">
          RM 1 buys <strong className="tabular">{formatMoney('US$', 1 / rate)}</strong>
          <span className="block text-sm text-ink-2">today {formatMoney('US$', 1 / spot)}</span>
        </p>
      </div>
      <div className="mt-4 flex flex-col items-start gap-2" aria-live="polite">
        <DirectionBadge direction={direction} size="lg" />
        <span className="text-sm tabular text-ink-2">
          MYR/USD {formatPctChange(pctChange(spot, rate))} · ringgit value {formatPctChange(pctChange(rate, spot))}
        </span>
      </div>
    </div>
  );
}

/* ---------- Fisher ---------- */

/** Real rate + inflation → nominal, with its own sliders. */
export function FisherLab({ start }: { start: { realPct: number; inflationPct: number } }) {
  const [real, setReal] = useState(start.realPct);
  const [inflation, setInflation] = useState(start.inflationPct);
  const r: Results = calculate({
    myInflationPct: inflation,
    usInflationPct: inflation,
    realRatePct: real,
    spotMyrPerUsd: 4.4,
    advanced: false,
  });
  const exact = fisherNominal(real / 100, inflation / 100) * 100;
  const approx = fisherApprox(real / 100, inflation / 100) * 100;
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        <LocalSlider
          label="Real interest rate"
          value={real}
          min={-3}
          max={10}
          step={0.1}
          onChange={setReal}
          format={formatInputPct}
        />
        <LocalSlider
          label="Expected inflation"
          value={inflation}
          min={-5}
          max={15}
          step={0.1}
          onChange={setInflation}
          format={formatInputPct}
        />
      </div>
      <p className="mt-6 text-center text-ink">
        <span className="text-sm font-bold uppercase tracking-wide text-ink-3">Nominal interest rate (Fisher)</span>
        <span className="block text-2xl font-bold tabular">
          <TweenNumber value={exact} format={formatRate} testId="fisher-lab-value" />
        </span>
      </p>
      <div className="mt-4">
        <FisherBar r={r} country="MY" domain={fisherDomain(r)} />
      </div>
      <p className="mt-4 text-center text-ink-2">
        Shortcut r + π = <strong className="tabular text-ink">{formatRate(approx)}</strong>
        <span className="block tabular">difference {fixed(exact - approx, 4)} pp</span>
      </p>
    </div>
  );
}

/* ---------- Exact vs approximate ---------- */

/** How far the shortcut (π_MY − π_US) × 100 is from the exact PPP change, as π_US moves. */
export function ApproxExplorer({ spot, myInflationPct, startUs }: { spot: number; myInflationPct: number; startUs: number }) {
  const [us, setUs] = useState(startUs);
  const v = approxVsExact(spot, myInflationPct, us);
  const max = Math.max(1, Math.abs(v.approx), Math.abs(v.exact));
  const bar = (value: number, tone: string, label: string) => (
    <div className="grid grid-cols-[7rem_1fr_6rem] items-center gap-4">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="relative h-6 rounded bg-surface-2" aria-hidden="true">
        <span className="absolute inset-y-0 left-1/2 w-px bg-ink" />
        <span
          className={`absolute inset-y-1 rounded transition-all duration-300 ${tone}`}
          style={
            value < 0
              ? { right: '50%', width: `${(Math.abs(value) / max) * 50}%` }
              : { left: '50%', width: `${(value / max) * 50}%` }
          }
        />
      </span>
      <span className="text-right text-sm font-bold tabular text-ink">{formatPctChange(value)}</span>
    </div>
  );
  return (
    <div>
      <LocalSlider label="US inflation" value={us} min={-5} max={15} step={0.1} onChange={setUs} format={formatInputPct} />
      <p className="mt-2 text-sm text-ink-2">
        Malaysia inflation stays at {formatInputPct(myInflationPct)}. Bars show the PPP change in MYR/USD.
      </p>
      <div className="mt-6 space-y-4">
        {bar(v.approx, 'bg-line-strong', 'Shortcut')}
        {bar(v.exact, 'bg-accent', 'Exact')}
      </div>
      <p className="mt-6 text-center text-lg text-ink" aria-live="polite">
        Error: <strong className="tabular">{formatPp(v.errorPp)}</strong>
      </p>
    </div>
  );
}

/* ---------- International Fisher Effect ---------- */

/** Forward (a price fixed today) vs IFE (an expectation for next year), on one timeline. */
export function IfeTimeline({ r }: { r: Results }) {
  const [focus, setFocus] = useState<'forward' | 'ife'>('forward');
  return (
    <div>
      <div role="group" aria-label="Choose one" className="flex flex-wrap justify-center gap-2">
        <button type="button" className="chip" aria-pressed={focus === 'forward'} onClick={() => setFocus('forward')}>
          Forward: a price
        </button>
        <button type="button" className="chip" aria-pressed={focus === 'ife'} onClick={() => setFocus('ife')}>
          IFE: an expectation
        </button>
      </div>
      <svg
        viewBox="0 0 600 170"
        className="mt-6 block h-auto w-full"
        role="img"
        aria-label={`Timeline: the forward ${formatSpot(r.cipForward)} MYR/USD is agreed today; the IFE expected spot ${formatSpot(r.ifeSpot)} MYR/USD is an expectation for one year ahead.`}
      >
        <line x1="60" x2="540" y1="110" y2="110" stroke="var(--color-ink)" strokeWidth="3" />
        <circle cx="60" cy="110" r="8" fill="var(--color-ink)" />
        <circle cx="540" cy="110" r="8" fill="var(--color-ink)" />
        <text x="60" y="145" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--color-ink)">
          Today
        </text>
        <text x="540" y="145" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--color-ink)">
          In one year
        </text>
        <g opacity={focus === 'forward' ? 1 : 0.35} className="transition-opacity duration-300">
          <rect
            x="70"
            y="20"
            width="200"
            height="56"
            rx="10"
            fill="var(--color-accent-soft)"
            stroke="var(--color-accent-strong)"
            strokeWidth="2"
          />
          <text x="170" y="43" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-ink)">
            Forward signed today
          </text>
          <text x="170" y="64" textAnchor="middle" fontSize="15" fill="var(--color-ink)">
            {formatSpot(r.cipForward)} MYR/USD
          </text>
          <line x1="90" x2="520" y1="98" y2="98" stroke="var(--color-accent-strong)" strokeWidth="3" />
          <path d="M 520 91 L 532 98 L 520 105 Z" fill="var(--color-accent-strong)" />
        </g>
        <g opacity={focus === 'ife' ? 1 : 0.35} className="transition-opacity duration-300">
          <rect
            x="330"
            y="20"
            width="200"
            height="56"
            rx="10"
            fill="var(--color-surface)"
            stroke="var(--color-us)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="430" y="43" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-ink)">
            Expected spot (IFE)
          </text>
          <text x="430" y="64" textAnchor="middle" fontSize="15" fill="var(--color-ink)">
            {formatSpot(r.ifeSpot)} MYR/USD?
          </text>
        </g>
      </svg>
      <Stack
        className="mt-4 rounded-xl bg-surface-2 p-4 text-ink"
        show={focus === 'forward' ? 0 : 1}
        items={[
          <p key="forward" aria-live={focus === 'forward' ? 'polite' : undefined}>
            The forward is a contract price fixed today. You will exchange at this rate in one year, whatever the spot rate turns
            out to be.
          </p>,
          <p key="ife" aria-live={focus === 'ife' ? 'polite' : undefined}>
            The IFE value is only an expectation of next year’s spot rate. The actual spot can end up far away from it.
          </p>,
        ]}
      />
    </div>
  );
}
