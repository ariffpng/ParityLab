import type { Inputs, Results } from '../lib/finance';
import { approxVerdict, interpret } from '../lib/interpretation';
import {
  approxTrace,
  cipTrace,
  differentialTrace,
  fisherTrace,
  ifeTrace,
  inflationGapTrace,
  parityTrace,
  pppTrace,
} from '../lib/traces';
import type { MathId } from './mathMeta';
import { RichText } from './RichText';
import { TraceSteps } from './TraceSteps';
import { AlertIcon } from './Icons';

function Lead({ children }: { children: string }) {
  return <p className="mb-4 text-base text-ink">{children}</p>;
}

/** Level 2 of the disclosure: the KaTeX traces plus two or three plain sentences. */
export function MathContent({ id, inputs, r }: { id: MathId; inputs: Inputs; r: Results }) {
  switch (id) {
    case 'ppp': {
      const why = interpret(inputs, r);
      return (
        <>
          <Lead>
            Relative PPP applies the inflation gap to today&apos;s rate. The result is a model scenario for one year, not a
            forecast.
          </Lead>
          <TraceSteps trace={pppTrace(r)} title="PPP future rate" />
          <TraceSteps trace={approxTrace(r)} title="Exact vs approximate" />
          <p className="mt-2 font-semibold text-ink">{approxVerdict(r)}</p>
          <section className="mt-6">
            <h3 className="mb-2 text-base font-bold text-ink">In words</h3>
            <p className="text-ink">
              <RichText text={why.directionMessage} />
            </p>
            <p className="mt-2 rounded-xl bg-surface-2 px-4 py-2 font-semibold text-ink">{why.costSentence}</p>
          </section>
          <section className="mt-6">
            <h3 className="mb-2 text-base font-bold text-ink">Compared with the baseline</h3>
            {why.changed.length === 0 ? (
              <p className="text-ink-2">Nothing changed — these are the Scenario A baseline assumptions.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-6 text-ink">
                {why.changed.map((c) => (
                  <li key={c}>
                    <span className="font-semibold">Changed:</span> {c}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm text-ink-2">
              <span className="font-semibold text-ink">Held constant:</span> {why.heldConstant.join('; ')}.
            </p>
          </section>
          {why.caveat && (
            <p className="mt-6 flex gap-2 rounded-xl bg-notice-soft p-4 text-sm text-notice-ink">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-bold">Caveat: </span>
                {why.caveat}
              </span>
            </p>
          )}
        </>
      );
    }
    case 'inflation':
      return (
        <>
          <Lead>
            The inflation gap drives the PPP result. A difference between two rates is measured in percentage points (pp), not
            percent.
          </Lead>
          <TraceSteps trace={inflationGapTrace(r)} />
        </>
      );
    case 'nominal':
      return (
        <>
          <Lead>
            Each nominal rate comes from the exact Fisher equation. The gap between them, in percentage points, sets the forward
            rate.
          </Lead>
          <TraceSteps trace={fisherTrace(r, 'MY')} title="Malaysia" />
          <TraceSteps trace={fisherTrace(r, 'US')} title="United States" />
          <TraceSteps trace={differentialTrace(r)} title="Nominal differential" />
        </>
      );
    case 'forward': {
      const why = interpret(inputs, r);
      return (
        <>
          <Lead>
            Covered interest rate parity prices the forward from today&apos;s rate and the two nominal rates. It is a contract
            price under no-arbitrage — not a bank quote and not a forecast; it ignores bid–ask spreads, credit and the
            cross-currency basis.
          </Lead>
          <TraceSteps trace={cipTrace(r)} title="Theoretical covered-IRP forward" />
          <TraceSteps
            trace={parityTrace(r)}
            title={r.parityMatch ? 'Why it equals the PPP rate here' : 'Why it differs from the PPP rate'}
          />
          <p className="mt-2 text-ink">
            <RichText text={why.parityMessage} />
          </p>
          <TraceSteps trace={ifeTrace(r)} title="Same algebra: International Fisher Effect" />
          <p className="mt-2 text-sm text-ink-2">
            Same number as the forward here, but the IFE value is an <em>expected spot</em>, not a contract price.
          </p>
        </>
      );
    }
    case 'fisher-my':
    case 'fisher-us':
      return (
        <>
          <Lead>
            The Fisher-implied nominal rate is (1 + real rate)(1 + expected inflation) − 1. The shortcut r + π misses the small
            cross-term.
          </Lead>
          <TraceSteps trace={fisherTrace(r, id === 'fisher-my' ? 'MY' : 'US')} />
        </>
      );
  }
}
