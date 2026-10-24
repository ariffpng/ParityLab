import { useState } from 'react';
import type { Results } from '../../lib/finance';
import { formatDecimal, formatSpotUnit } from '../../lib/format';
import { learnRoute } from '../../routes';
import { EqualIcon, NotEqualIcon } from '../Icons';
import { LearnMoreLink } from '../RouteLink';
import { Stack } from '../Stack';

/**
 * Why the forward equals PPP here: substitute Fisher into covered IRP and the
 * common (1 + r) factor cancels. With unequal real rates the factors differ and
 * nothing cancels.
 */
export function CancelAnimation({ r }: { r: Results }) {
  const [cancelled, setCancelled] = useState(false);
  const common = r.rMY === r.rUS;
  const g = (x: number) => formatDecimal(1 + x);

  return (
    <div>
      <div className="flex flex-col items-center gap-2 text-xl text-ink" aria-live="polite">
        <div className="flex flex-wrap items-center justify-center gap-2 font-semibold">
          <span>(1 + i_MY) / (1 + i_US) =</span>
          <span className="inline-flex flex-col items-center">
            <span className="flex gap-2 border-b-2 border-ink px-2 pb-1">
              <Factor text={`(1 + r${common ? '' : '_MY'})`} value={g(r.rMY)} struck={cancelled && common} />
              <Factor text="(1 + π_MY)" value={g(r.piMY)} />
            </span>
            <span className="flex gap-2 px-2 pt-1">
              <Factor text={`(1 + r${common ? '' : '_US'})`} value={g(r.rUS)} struck={cancelled && common} />
              <Factor text="(1 + π_US)" value={g(r.piUS)} />
            </span>
          </span>
          {common && (
            <span className={cancelled ? 'fade-in' : 'invisible'} aria-hidden={cancelled ? undefined : true}>
              = (1 + π_MY) / (1 + π_US)
            </span>
          )}
        </div>
        {/* The result line always keeps its space (hidden until used), so the button below stays put. */}
        <div className={cancelled ? '' : 'invisible'} aria-hidden={cancelled ? undefined : true}>
          <p
            className="fade-in mt-4 flex items-center gap-2 text-lg font-bold"
            data-testid={cancelled ? 'cancel-result' : undefined}
          >
            {common ? (
              <>
                <EqualIcon className="h-6 w-6 text-up-ink" /> The PPP ratio is left, so forward = PPP future rate ={' '}
                {formatSpotUnit(r.cipForward)}
              </>
            ) : (
              <>
                <NotEqualIcon className="h-6 w-6 text-down-ink" /> {g(r.rMY)} ≠ {g(r.rUS)}: nothing cancels; the ratio is{' '}
                {formatDecimal(r.realRateRatio)}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button type="button" className="btn btn-primary" onClick={() => setCancelled((c) => !c)}>
          <Stack inline show={cancelled ? 1 : 0} items={['Cancel the common term', 'Undo']} />
        </button>
        {!common && <LearnMoreLink to={learnRoute('advanced-lab')} label="See the advanced lab" />}
      </div>
    </div>
  );
}

function Factor({ text, value, struck = false }: { text: string; value: string; struck?: boolean }) {
  return (
    <span
      className={`inline-flex flex-col items-center rounded-lg px-2 py-1 transition-opacity duration-300 ${struck ? 'opacity-40' : 'bg-accent-soft'}`}
    >
      <span className={struck ? 'strike' : undefined}>{text}</span>
      <span className="text-sm font-normal tabular text-ink-2">{value}</span>
    </span>
  );
}
