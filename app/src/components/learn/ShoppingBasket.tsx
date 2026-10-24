import { useState, type ReactNode } from 'react';
import type { Results } from '../../lib/finance';
import { formatInputPct, formatMoney, formatSpot } from '../../lib/format';
import { basketPrices } from '../../lib/visuals';
import { BasketIcon, PlayIcon, ResetIcon } from '../Icons';
import { Stack } from '../Stack';
import { TweenNumber } from '../TweenNumber';

/**
 * PPP shopping basket: the same basket costs RM S₀ in Malaysia and US$1 in the
 * US today. Both price tags inflate for a year; the exchange rate that keeps the
 * basket equally priced is the PPP future rate.
 */
export function ShoppingBasket({ r }: { r: Results }) {
  const [played, setPlayed] = useState(false);
  const p = basketPrices(r);
  const rm = played ? p.rmNext : p.rmToday;
  const usd = played ? p.usdNext : p.usdToday;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Tag
          country="Malaysia"
          tone="my"
          inflation={formatInputPct(r.piMY * 100)}
          played={played}
          price={<TweenNumber value={rm} format={(v) => formatMoney('RM', v)} testId="basket-rm" />}
        />
        <Tag
          country="United States"
          tone="us"
          inflation={formatInputPct(r.piUS * 100)}
          played={played}
          price={<TweenNumber value={usd} format={(v) => formatMoney('US$', v)} testId="basket-usd" />}
        />
      </div>
      {/* Both states share one box (the larger), so the button below never moves. */}
      <Stack
        className="mt-6 rounded-xl bg-surface-2 p-4 text-center text-lg text-ink"
        show={played ? 1 : 0}
        items={[
          <RateLine key="today" label="Today" rm={p.rmToday} usd={p.usdToday} rate={p.rmToday / p.usdToday} live={!played} />,
          <RateLine key="year" label="In one year" rm={p.rmNext} usd={p.usdNext} rate={p.impliedRate} live={played} explain />,
        ]}
      />
      <div className="mt-4 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={() => setPlayed((x) => !x)}>
          <Stack
            inline
            show={played ? 1 : 0}
            items={[
              <span key="play" className="inline-flex items-center justify-center gap-2">
                <PlayIcon className="h-5 w-5" /> Play one year
              </span>,
              <span key="back" className="inline-flex items-center justify-center gap-2">
                <ResetIcon className="h-5 w-5" /> Back to today
              </span>,
            ]}
          />
        </button>
      </div>
    </div>
  );
}

function Tag({
  country,
  tone,
  inflation,
  played,
  price,
}: {
  country: string;
  tone: 'my' | 'us';
  inflation: string;
  played: boolean;
  price: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${tone === 'my' ? 'border-my bg-my-soft' : 'border-us bg-us-soft'}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-ink-2">{country}</p>
      <BasketIcon className={`mx-auto mt-2 h-16 w-16 ${tone === 'my' ? 'text-my-ink' : 'text-us-ink'}`} />
      <p
        className="mx-auto mt-4 inline-block rounded-lg bg-surface px-4 py-2 text-xl font-bold tabular text-ink shadow transition-transform duration-300 ease-out"
        style={{ transform: played ? 'scale(1.08) rotate(-2deg)' : 'none' }}
      >
        {price}
      </p>
      <p className="mt-2 text-sm text-ink-2">expected inflation {inflation}</p>
    </div>
  );
}

function RateLine({
  label,
  rm,
  usd,
  rate,
  live,
  explain,
}: {
  label: string;
  rm: number;
  usd: number;
  rate: number;
  live: boolean;
  explain?: boolean;
}) {
  return (
    <p aria-live={live ? 'polite' : undefined}>
      {label}: {formatMoney('RM', rm)} ÷ {formatMoney('US$', usd)} ={' '}
      <strong className="tabular" data-testid={live ? 'basket-rate' : undefined}>
        {formatSpot(rate)} MYR/USD
      </strong>
      {explain && <span className="block text-base text-ink-2">Same as the PPP future rate: S₀ × (1 + π_MY)/(1 + π_US).</span>}
    </p>
  );
}
