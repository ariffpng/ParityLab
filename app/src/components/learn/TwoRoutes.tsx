import { useState, type ReactNode } from 'react';
import type { Results } from '../../lib/finance';
import { formatMoney, formatRate, formatSpot } from '../../lib/format';
import { twoRoutes } from '../../lib/visuals';
import { CIP_DERIVATION } from '../../content/formulas';
import { ArrowRightIcon, CheckIcon, ResetIcon } from '../Icons';
import { Stack } from '../Stack';
import { Tex } from '../Tex';

const LAST = CIP_DERIVATION.length;

/**
 * Covered IRP as two routes from RM 1, revealed one step at a time with live
 * numbers. Route 1 invests in Malaysia; route 2 converts at S₀, invests in the
 * US and converts back at the forward F. Both end with the same ringgit.
 */
export function TwoRoutes({ r }: { r: Results }) {
  const [step, setStep] = useState(0);
  const v = twoRoutes(r);
  const shown = (k: number) => step >= k;
  const money = (c: 'RM' | 'US$', x: number) => formatMoney(c, x, 6);

  return (
    <div>
      <div className="space-y-6">
        <Route title="Route 1 · stay in Malaysia" tone="my">
          <Station label="Start" value={money('RM', v.start)} visible />
          <Hop label={`invest at ${formatRate(r.nominalMYPct)}`} visible={shown(1)} />
          <Station label="After one year" value={money('RM', v.home)} visible={shown(1)} final testId="route-home" />
        </Route>
        <Route title="Route 2 · go via the US" tone="us">
          <Station label="Start" value={money('RM', v.start)} visible />
          <Hop label={`convert at ${formatSpot(r.spot)}`} visible={shown(2)} />
          <Station label="Today" value={money('US$', v.usdNow)} visible={shown(2)} />
          <Hop label={`invest at ${formatRate(r.nominalUSPct)}`} visible={shown(3)} />
          <Station label="After one year" value={money('US$', v.usdLater)} visible={shown(3)} />
          <Hop label={`convert back at F = ${formatSpot(r.cipForward)}`} visible={shown(4)} />
          <Station label="Back in ringgit" value={money('RM', v.abroadBack)} visible={shown(4)} final testId="route-abroad" />
        </Route>
      </div>

      {/* Every step's caption is laid in the same box, so its height never changes and the buttons stay put. */}
      <Stack
        className="mt-6 rounded-xl bg-surface-2 p-4"
        show={step}
        items={[
          <p key="start" className="text-ink">
            Both routes start with RM 1. Press “Next step” to follow the money.
          </p>,
          ...CIP_DERIVATION.map((d, k) => (
            <div key={d.text}>
              <p className="font-semibold text-ink">
                Step {k + 1} of {LAST}: {d.text}
              </p>
              <Tex display tex={d.tex} />
              {k + 1 === LAST && (
                <p className="mt-2 flex items-center gap-2 font-bold text-up-ink">
                  <CheckIcon className="h-5 w-5" /> Both routes end with {money('RM', v.home)}: no arbitrage.
                </p>
              )}
            </div>
          )),
        ]}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <button type="button" className="btn" onClick={() => setStep(0)} disabled={step === 0}>
          <ResetIcon className="h-5 w-5" /> Restart
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setStep((s) => Math.min(LAST, s + 1))}
          disabled={step === LAST}
        >
          Next step <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function Route({ title, tone, children }: { title: string; tone: 'my' | 'us'; children: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className={`h-3 w-3 rounded-full ${tone === 'my' ? 'bg-my' : 'bg-us'}`} aria-hidden="true" />
        {title}
      </p>
      <ol className="mt-2 flex flex-wrap items-center gap-2">{children}</ol>
    </div>
  );
}

function Station({
  label,
  value,
  visible,
  final,
  testId,
}: {
  label: string;
  value: string;
  visible: boolean;
  final?: boolean;
  testId?: string;
}) {
  return (
    <li
      className={`rounded-xl border px-4 py-2 transition-opacity duration-300 ${final ? 'border-accent bg-accent-soft' : 'border-line bg-surface'} ${visible ? 'opacity-100' : 'opacity-40'}`}
      data-testid={testId}
    >
      <span className="block text-xs font-bold uppercase tracking-wide text-ink-3">{label}</span>
      {/* The value is always laid out (hidden until reached), so each box keeps its size. */}
      <span className="grid text-lg font-bold tabular text-ink">
        <span className={`col-start-1 row-start-1 ${visible ? '' : 'invisible'}`}>{value}</span>
        {!visible && (
          <span className="col-start-1 row-start-1" aria-hidden="true">
            ?
          </span>
        )}
      </span>
    </li>
  );
}

function Hop({ label, visible }: { label: string; visible: boolean }) {
  return (
    <li
      className={`flex items-center gap-1 text-sm text-ink-2 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-40'}`}
    >
      <span className="grid tabular">
        <span className={`col-start-1 row-start-1 ${visible ? '' : 'invisible'}`}>{label}</span>
        {!visible && (
          <span className="col-start-1 row-start-1" aria-hidden="true">
            …
          </span>
        )}
      </span>
      <ArrowRightIcon className="h-4 w-4" />
    </li>
  );
}
