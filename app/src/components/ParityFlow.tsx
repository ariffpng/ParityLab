import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Results } from '../lib/finance';
import { formatInputPct, formatPp, formatRate, formatSpot } from '../lib/format';
import { NotEqualIcon, EqualIcon } from './Icons';
import { SrTable } from './SrTable';
import { TweenNumber } from './TweenNumber';

export type FlowNode = 'inflation' | 'nominal' | 'ppp' | 'forward';

type Props = { r: Results; onOpen: (node: FlowNode) => void };

/** Counts how many times `signature` has changed since mount (0 = never), to replay a pulse. */
function useChangeCount(signature: string): number {
  const [count, setCount] = useState(0);
  const first = useRef(signature);
  useEffect(() => {
    if (signature !== first.current) {
      first.current = signature;
      setCount((c) => c + 1);
    }
  }, [signature]);
  return count;
}

/** Arrow thickness grows with the size of the differential (pp), within 2–8 px. */
function strokeFor(pp: number): number {
  return Math.min(8, 2 + Math.abs(pp) * 1.5);
}

/**
 * Parity-flow diagram: Inflation → Nominal rates → PPP future rate = Forward rate.
 * Live values; the path that changed pulses; nodes open their "Show the math"
 * drawer. "=" turns into "≠" with the gap when real rates differ.
 */
export function ParityFlow({ r, onOpen }: Props) {
  const inflationSig = `${r.piMY}|${r.piUS}`;
  const nominalSig = `${r.nominalMYPct}|${r.nominalUSPct}`;
  const pppSig = `${r.pppSpot}`;
  const forwardSig = `${r.cipForward}`;
  const pulses = {
    inflation: useChangeCount(inflationSig),
    nominal: useChangeCount(nominalSig),
    ppp: useChangeCount(pppSig),
    forward: useChangeCount(forwardSig),
  };
  const gap = Math.abs(r.parityGap);
  const equal = r.parityMatch;

  return (
    <div data-testid="flow-diagram">
      <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)_5.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)] lg:gap-0">
        <Node
          id="inflation"
          title="Inflation"
          tip="The expected inflation assumptions you set."
          pulse={pulses.inflation}
          onOpen={onOpen}
        >
          <Pair my={formatInputPct(r.piMY * 100)} us={formatInputPct(r.piUS * 100)} />
        </Node>
        <Arrow label={formatPp(r.inflationDiffPp)} width={strokeFor(r.inflationDiffPp)} pulse={pulses.inflation} />
        <Node
          id="nominal"
          title="Nominal rates"
          tip="Fisher: real rate plus expected inflation."
          pulse={pulses.nominal}
          onOpen={onOpen}
        >
          <Pair
            my={<TweenNumber value={r.nominalMYPct} format={formatRate} />}
            us={<TweenNumber value={r.nominalUSPct} format={formatRate} />}
          />
        </Node>
        <Arrow label={formatPp(r.nominalDiffPp)} width={strokeFor(r.nominalDiffPp)} pulse={pulses.nominal} />
        <Node
          id="ppp"
          title="PPP rate"
          tip="The inflation gap applied to today's rate."
          pulse={pulses.ppp}
          onOpen={onOpen}
          accent
        >
          <Level value={r.pppSpot} />
        </Node>
        {/* Fixed-size slot: "=" and "≠ 0.0427" occupy the same box, so the nodes never move. */}
        <div className="flex h-12 items-center justify-center px-2 lg:h-auto" data-testid="parity-sign" data-equal={equal}>
          {equal ? (
            <span className="inline-flex items-center gap-1 text-ink" title="Equal: the forward matches the PPP rate">
              <EqualIcon className="h-6 w-6" />
              <span className="sr-only">equals</span>
            </span>
          ) : (
            <span className="inline-flex flex-col items-center text-down-ink">
              <span className="inline-flex items-center" aria-hidden="true">
                <NotEqualIcon className="h-6 w-6" />
              </span>
              <span className="sr-only">does not equal; </span>
              <span className="text-xs font-bold tabular">{formatSpot(gap)}</span>
            </span>
          )}
        </div>
        <Node
          id="forward"
          title="Forward rate"
          tip="The no-arbitrage price from the two nominal rates."
          pulse={pulses.forward}
          onOpen={onOpen}
        >
          <Level value={r.cipForward} />
        </Node>
      </div>
      <SrTable
        caption="Parity flow (model values)"
        rows={[
          ['Malaysia expected inflation', formatInputPct(r.piMY * 100)],
          ['US expected inflation', formatInputPct(r.piUS * 100)],
          ['Inflation differential', formatPp(r.inflationDiffPp)],
          ['Malaysia nominal rate', formatRate(r.nominalMYPct)],
          ['US nominal rate', formatRate(r.nominalUSPct)],
          ['Nominal differential', formatPp(r.nominalDiffPp)],
          ['PPP future rate', `${formatSpot(r.pppSpot)} MYR/USD`],
          ['Forward rate (theoretical)', `${formatSpot(r.cipForward)} MYR/USD`],
          ['Forward vs PPP', equal ? 'Equal' : `Differ by ${formatSpot(gap)} MYR/USD`],
        ]}
      />
    </div>
  );
}

function Node({
  id,
  title,
  tip,
  pulse,
  onOpen,
  accent,
  children,
}: {
  id: FlowNode;
  title: string;
  tip: string;
  pulse: number;
  onOpen: (node: FlowNode) => void;
  accent?: boolean;
  children: ReactNode;
}) {
  const tipId = `flow-tip-${id}`;
  return (
    <div className="group relative min-w-0">
      <button
        type="button"
        onClick={() => onOpen(id)}
        aria-describedby={tipId}
        data-node={id}
        className={`relative flex h-full w-full flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition-colors hover:border-ink ${accent ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'}`}
      >
        {pulse > 0 && <span key={pulse} className="pulse pointer-events-none absolute inset-0 rounded-xl" aria-hidden="true" />}
        <span className="text-sm font-bold text-ink">{title}</span>
        {children}
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-lg bg-ink px-3 py-2 text-sm text-on-panel shadow-lg group-focus-within:block group-hover:block"
      >
        {tip}
      </span>
    </div>
  );
}

function Pair({ my, us }: { my: ReactNode; us: ReactNode }) {
  return (
    <span className="grid w-full gap-0.5 whitespace-nowrap text-sm font-semibold tabular text-ink">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-my" aria-hidden="true" />
        <span className="text-sm font-bold text-my-ink">MY</span> {my}
      </span>
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-us" aria-hidden="true" />
        <span className="text-sm font-bold text-us-ink">US</span> {us}
      </span>
    </span>
  );
}

function Level({ value }: { value: number }) {
  return (
    <span className="text-lg font-bold tabular text-ink">
      <TweenNumber value={value} format={formatSpot} /> <span className="text-sm font-semibold text-ink-2">MYR/USD</span>
    </span>
  );
}

function Arrow({ label, width, pulse }: { label: string; width: number; pulse: number }) {
  return (
    <div className="flex h-8 items-center justify-center gap-2 px-2 lg:h-auto lg:flex-col lg:gap-0" aria-hidden="true">
      <span className="text-xs font-bold tabular text-ink-2 lg:order-first">{label}</span>
      <svg viewBox="0 0 48 24" className="h-6 w-10 rotate-90 lg:w-12 lg:rotate-0" key={pulse}>
        <line
          x1="2"
          y1="12"
          x2="36"
          y2="12"
          stroke="var(--color-ink-2)"
          strokeWidth={width}
          strokeLinecap="round"
          className={pulse > 0 ? 'flow-flash' : undefined}
        />
        <path d="M 34 4 L 46 12 L 34 20 Z" fill="var(--color-ink-2)" />
      </svg>
    </div>
  );
}
