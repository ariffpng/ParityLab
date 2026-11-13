import type { ReactNode } from 'react';
import type { Results } from '../lib/finance';
import { quoteMoveSentence, ringgitValueSentence } from '../lib/directionCopy';
import { formatRate, formatSpot } from '../lib/format';
import { learnRoute } from '../routes';
import { DirectionBadge } from './DirectionBadge';
import { FisherBar } from './FisherBar';
import { EqualIcon, MathIcon, NotEqualIcon } from './Icons';
import { InfoTip } from './InfoTip';
import { LearnMoreLink, RouteLink } from './RouteLink';
import { SeeSaw } from './SeeSaw';
import { TweenNumber } from './TweenNumber';

export function MathButton({ onClick, about }: { onClick: () => void; about: string }) {
  return (
    <button type="button" className="btn-math" onClick={onClick}>
      <MathIcon className="h-4 w-4" />
      Show the math<span className="sr-only">: {about}</span>
    </button>
  );
}

/** The Simulator's focal point: the PPP future rate, its direction and the see-saw. */
export function HeroResult({ r, onMath, highlighted }: { r: Results; onMath: () => void; highlighted?: boolean }) {
  return (
    <section id="card-ppp" aria-labelledby="hero-title" className={`card p-6 lg:p-8 ${highlighted ? 'highlight-ring' : ''}`}>
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="hero-title" className="text-lg font-bold text-ink">
              PPP future rate
            </h2>
            <span className="tag">model scenario</span>
            <InfoTip label="About the PPP future rate">
              PPP-implied future spot (model scenario, long-run benchmark): today&apos;s rate adjusted for the inflation gap over
              one year. Not a forecast.
            </InfoTip>
          </div>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-4 text-ink">
            <TweenNumber value={r.pppSpot} format={formatSpot} className="hero-number text-3xl md:text-4xl" testId="ppp-value" />
            <span className="text-xl font-bold text-ink-2">MYR/USD</span>
          </p>
          <p className="mt-4 text-lg text-ink">
            In one year: <strong className="tabular">US$1 = RM {formatSpot(r.pppSpot)}</strong>
          </p>
          <div className="mt-4 flex flex-col items-start gap-3">
            <DirectionBadge direction={r.myrDirection} size="lg" />
            {/* Each percentage carries its own words, so no sign has to be decoded. */}
            <ul className="space-y-1 text-base tabular text-ink-2" data-testid="direction-detail">
              <li className="whitespace-nowrap">{quoteMoveSentence(r)}</li>
              <li className="whitespace-nowrap">{ringgitValueSentence(r)}</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <MathButton onClick={onMath} about="PPP future rate" />
            <LearnMoreLink to={learnRoute('ppp')} about="Purchasing Power Parity" />
          </div>
        </div>
        <SeeSaw
          className="mx-auto w-full max-w-60 md:max-w-none"
          spot={r.spot}
          ppp={r.pppSpot}
          quoteChangePct={r.quoteChangePct}
          myrValueChangePct={r.myrValueChangePct}
          direction={r.myrDirection}
        />
      </div>
    </section>
  );
}

type MetricProps = {
  id: string;
  title: ReactNode;
  /** Plain-text title for the "Show the math" button's accessible name. */
  name: string;
  value: ReactNode;
  children?: ReactNode;
  onMath: () => void;
  highlighted?: boolean;
};

/** A compact result card: big number, one-line visual/caption and "Show the math". */
export function MetricCard({ id, title, name, value, children, onMath, highlighted }: MetricProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`card flex flex-col p-6 ${highlighted ? 'highlight-ring' : ''}`}>
      <h3 id={`${id}-title`} className="flex items-start gap-2 text-base font-bold text-ink md:min-h-[3.25rem]">
        {title}
      </h3>
      <p className="mt-2 text-xl font-bold tabular text-ink">{value}</p>
      {children && <div className="mt-4">{children}</div>}
      {/* The topic link lives in the drawer's footer, one step away; the card keeps one action. */}
      <div className="mt-auto pt-4">
        <MathButton onClick={onMath} about={name} />
      </div>
    </section>
  );
}

export function FisherCard({
  r,
  country,
  domain,
  onMath,
  highlighted,
}: {
  r: Results;
  country: 'MY' | 'US';
  domain: [number, number];
  onMath: () => void;
  highlighted?: boolean;
}) {
  const my = country === 'MY';
  return (
    <MetricCard
      id={my ? 'card-fisher-my' : 'card-fisher-us'}
      title={
        <>
          <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${my ? 'bg-my' : 'bg-us'}`} aria-hidden="true" />
          {my ? 'Malaysia' : 'US'} nominal rate (Fisher)
        </>
      }
      name={`${my ? 'Malaysia' : 'US'} nominal rate`}
      value={<TweenNumber value={my ? r.nominalMYPct : r.nominalUSPct} format={formatRate} />}
      onMath={onMath}
      highlighted={highlighted}
    >
      <FisherBar r={r} country={country} domain={domain} />
    </MetricCard>
  );
}

export function ForwardCard({ r, onMath, highlighted }: { r: Results; onMath: () => void; highlighted?: boolean }) {
  const equal = r.parityMatch;
  return (
    <MetricCard
      id="card-cip"
      title="Forward rate (theoretical)"
      name="Forward rate"
      value={
        <>
          <TweenNumber value={r.cipForward} format={formatSpot} testId="cip-value" />{' '}
          <span className="text-base font-semibold text-ink-2">MYR/USD</span>
        </>
      }
      onMath={onMath}
      highlighted={highlighted}
    >
      <RouteLink
        to={learnRoute(equal ? 'forward-equals-ppp' : 'advanced-lab')}
        className="tag no-underline hover:border-ink"
        aria-label={
          equal
            ? 'Equals the PPP rate here — why?'
            : `Differs from the PPP rate by ${formatSpot(Math.abs(r.parityGap))} MYR/USD — why?`
        }
      >
        <span className="inline-grid text-sm">
          <span data-testid="parity-chip" className="col-start-1 row-start-1 inline-flex items-center gap-1 tabular">
            {equal ? <EqualIcon className="h-4 w-4" /> : <NotEqualIcon className="h-4 w-4" />}
            {equal ? 'Same as PPP: why?' : `Differs by ${formatSpot(Math.abs(r.parityGap))}: why?`}
          </span>
          {/* Reserves the widest label so the chip keeps one size in both modes. */}
          <span className="invisible col-start-1 row-start-1 inline-flex items-center gap-1 tabular" aria-hidden="true">
            <NotEqualIcon className="h-4 w-4" />
            Differs by 88.8888: why?
          </span>
        </span>
      </RouteLink>
      <p className="mt-4 text-sm text-ink-2">A contract price fixed today for one year ahead, not a forecast.</p>
    </MetricCard>
  );
}
