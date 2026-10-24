import type { Evaluation } from '../../lib/evaluate';
import type { Results } from '../../lib/finance';
import type { RawInputs } from '../../lib/validation';
import { formatDecimal, formatSpot } from '../../lib/format';
import { RateField } from '../Fields';
import { ArrowRightIcon, EqualIcon, NotEqualIcon } from '../Icons';
import { TweenNumber } from '../TweenNumber';

type Props = {
  raw: RawInputs;
  evaluation: Evaluation;
  onChange: (next: RawInputs) => void;
  onOpenInSimulator: () => void;
};

/**
 * Advanced lab: separate real-rate sliders for each country. Inflation and
 * today's rate come from the simulator. Shows PPP vs the theoretical forward
 * and the F/S_PPP = (1 + r_MY)/(1 + r_US) diagnostic.
 */
export function AdvancedLab({ raw, evaluation, onChange, onOpenInSimulator }: Props) {
  const r = evaluation.ok ? evaluation.results : null;
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        <RateField
          id="lab-field-myRealRate"
          field="myRealRate"
          label="Malaysia real rate"
          dot="my"
          value={raw.myRealRate}
          error={evaluation.errors.myRealRate}
          onChange={(v) => onChange({ ...raw, myRealRate: v })}
        />
        <RateField
          id="lab-field-usRealRate"
          field="usRealRate"
          label="US real rate"
          dot="us"
          value={raw.usRealRate}
          error={evaluation.errors.usRealRate}
          onChange={(v) => onChange({ ...raw, usRealRate: v })}
        />
      </div>
      {/* The result area keeps its size when the inputs are invalid: an invisible placeholder
          (dashes, never numbers) holds the space under the message, so the button below stays put. */}
      <div className="mt-6 grid">
        <div
          className="col-start-1 row-start-1"
          style={r ? undefined : { visibility: 'hidden' }}
          aria-hidden={r ? undefined : true}
        >
          <LabResult r={r} />
        </div>
        {!r && (
          <p
            className="col-start-1 row-start-1 self-center rounded-xl bg-down-soft p-4 font-semibold text-error"
            data-testid="results-hidden"
          >
            Results hidden until the lab inputs and your simulator inputs are valid.
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={onOpenInSimulator} disabled={!evaluation.ok}>
          Open in simulator <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function LabResult({ r }: { r: Results | null }) {
  return (
    <>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_5rem_1fr]" data-testid={r ? 'lab-result' : undefined}>
        <div className="rounded-xl border border-accent bg-accent-soft p-4 text-center">
          <p className="text-sm font-bold text-ink-2">PPP future rate</p>
          <p className="text-xl font-bold tabular text-ink">
            {r ? <TweenNumber value={r.pppSpot} format={formatSpot} testId="lab-ppp" /> : '—'}{' '}
            <span className="text-base text-ink-2">MYR/USD</span>
          </p>
        </div>
        {/* Fixed-size slot for "=" or "≠ gap". */}
        <div className="flex h-16 items-center justify-center text-center" data-testid={r ? 'lab-sign' : undefined}>
          {!r || r.parityMatch ? (
            <span className="inline-flex items-center gap-1 font-bold text-ink">
              <EqualIcon className="h-8 w-8" /> <span className="sr-only">equals</span>
            </span>
          ) : (
            <span className="inline-flex flex-col items-center font-bold text-down-ink">
              <NotEqualIcon className="h-8 w-8" />
              <span className="text-sm tabular">
                <span className="sr-only">differs by </span>
                {formatSpot(Math.abs(r.parityGap))}
              </span>
            </span>
          )}
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
          <p className="text-sm font-bold text-ink-2">Forward rate (theoretical)</p>
          <p className="text-xl font-bold tabular text-ink">
            {r ? <TweenNumber value={r.cipForward} format={formatSpot} testId="lab-cip" /> : '—'}{' '}
            <span className="text-base text-ink-2">MYR/USD</span>
          </p>
        </div>
      </div>
      <p className="mt-4 min-h-14 text-center text-lg tabular text-ink sm:min-h-7">
        F / PPP = (1 + r_MY)/(1 + r_US) = {r ? `${formatDecimal(1 + r.rMY)}/${formatDecimal(1 + r.rUS)}` : '—'} ={' '}
        <strong>{r ? formatDecimal(r.realRateRatio) : '—'}</strong>
      </p>
    </>
  );
}
