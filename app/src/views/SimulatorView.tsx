import { useState } from 'react';
import type { Evaluation } from '../lib/evaluate';
import type { RawInputs, FieldKey } from '../lib/validation';
import type { PresetId } from '../lib/scenarios';
import { activePresetId } from '../lib/chips';
import { oneLineSummary, shouldShowSpikeCallout, SPIKE_CALLOUT } from '../lib/interpretation';
import { fisherDomain } from '../lib/visuals';
import { learnRoute } from '../routes';
import { AssumptionsPanel } from '../components/AssumptionsPanel';
import { Drawer } from '../components/Drawer';
import { MathContent } from '../components/MathContent';
import { MATH_META, type MathId } from '../components/mathMeta';
import { ParityFlow, type FlowNode } from '../components/ParityFlow';
import { FisherCard, ForwardCard, HeroResult } from '../components/ResultCards';
import { LearnMoreLink, RouteLink } from '../components/RouteLink';
import { AlertIcon, ArrowRightIcon, ResetIcon } from '../components/Icons';
import { KeepHeight } from '../components/KeepHeight';
import { ResultAnnouncer } from '../components/ResultAnnouncer';
import { resultAnnouncement } from '../lib/directionCopy';

type Props = {
  raw: RawInputs;
  evaluation: Evaluation;
  onRawChange: (next: RawInputs) => void;
  onPreset: (id: PresetId) => void;
  onReset: () => void;
  onSendToCompare: () => void;
  onCopySummary: () => void;
  highlight: string[];
};

const FIELD_NAMES: Record<FieldKey, string> = {
  myInflation: 'Malaysia inflation',
  usInflation: 'US inflation',
  realRate: 'Real interest rate',
  myRealRate: 'Malaysia real rate',
  usRealRate: 'US real rate',
  spot: "Today's rate",
};

const NODE_MATH: Record<FlowNode, MathId> = { inflation: 'inflation', nominal: 'nominal', ppp: 'ppp', forward: 'forward' };

export function SimulatorView({
  raw,
  evaluation,
  onRawChange,
  onPreset,
  onReset,
  onSendToCompare,
  onCopySummary,
  highlight,
}: Props) {
  const [math, setMath] = useState<MathId | null>(null);
  const lit = (id: string) => highlight.includes(id);

  return (
    <div className="page pb-16 pt-6 lg:pt-8">
      <h1 tabIndex={-1} className="view-heading sr-only">
        Simulator
      </h1>
      <div className="grid-12 items-start">
        <div className="col-span-12 lg:col-span-4">
          <AssumptionsPanel
            raw={raw}
            errors={evaluation.errors}
            valid={evaluation.ok}
            activePreset={activePresetId(evaluation.inputs)}
            onChange={onRawChange}
            onPreset={onPreset}
            onReset={onReset}
            onSendToCompare={onSendToCompare}
            onCopySummary={onCopySummary}
            highlight={highlight}
          />
        </div>

        <KeepHeight hold={!evaluation.ok} className="col-span-12 min-w-0 space-y-6 lg:col-span-8">
          {evaluation.ok ? (
            <>
              <HeroResult r={evaluation.results} onMath={() => setMath('ppp')} highlighted={lit('card-ppp')} />

              <section
                aria-labelledby="flow-heading"
                className={`card p-6 ${lit('flow-card') ? 'highlight-ring' : ''}`}
                id="flow-card"
              >
                <h2 id="flow-heading" className="sr-only">
                  How the parity chain connects
                </h2>
                <ParityFlow r={evaluation.results} onOpen={(node) => setMath(NODE_MATH[node])} />
                <p className="mt-4 text-sm text-ink-2">
                  Gaps are Malaysia minus US, in pp (percentage points: 3% − 2.5% = 0.5 pp).
                </p>
              </section>

              <div className="grid gap-6 md:grid-cols-3">
                <FisherCard
                  r={evaluation.results}
                  country="MY"
                  domain={fisherDomain(evaluation.results)}
                  onMath={() => setMath('fisher-my')}
                  highlighted={lit('card-fisher-my')}
                />
                <FisherCard
                  r={evaluation.results}
                  country="US"
                  domain={fisherDomain(evaluation.results)}
                  onMath={() => setMath('fisher-us')}
                  highlighted={lit('card-fisher-us')}
                />
                <ForwardCard r={evaluation.results} onMath={() => setMath('forward')} highlighted={lit('card-cip')} />
              </div>

              <div className="space-y-2 px-2" data-testid="summary">
                <p className="text-lg font-semibold text-ink">{oneLineSummary(evaluation.results)}</p>
                <p className="text-sm text-ink-2">
                  A model scenario, not a prediction —{' '}
                  <RouteLink to={learnRoute('limitations')} className="link-more">
                    see what it can&apos;t tell you <ArrowRightIcon className="h-4 w-4" />
                  </RouteLink>
                </p>
              </div>

              {shouldShowSpikeCallout(evaluation.inputs) && (
                <div
                  role="note"
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent bg-notice-soft px-6 py-4 text-notice-ink"
                >
                  <AlertIcon className="h-5 w-5 shrink-0" />
                  <span className="font-semibold">{SPIKE_CALLOUT}</span>
                </div>
              )}

              <Drawer
                open={math !== null}
                title={math ? MATH_META[math].title : ''}
                onClose={() => setMath(null)}
                footer={math && <LearnMoreLink to={learnRoute(MATH_META[math].topic)} about={MATH_META[math].about} />}
              >
                {math && <MathContent id={math} inputs={evaluation.inputs} r={evaluation.results} />}
              </Drawer>
            </>
          ) : (
            <section className="card border-2 border-error p-6" aria-labelledby="invalid-heading" data-testid="results-hidden">
              <h2 id="invalid-heading" className="flex items-center gap-2 text-lg font-bold text-error">
                <AlertIcon className="h-5 w-5" /> Results hidden
              </h2>
              <p className="mt-2 text-ink-2">ParityLab never shows numbers from invalid inputs. Fix:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(evaluation.errors) as FieldKey[]).map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        const input = document.getElementById(`sim-field-${key}-input`);
                        input?.scrollIntoView({ block: 'center' });
                        input?.focus();
                      }}
                    >
                      {FIELD_NAMES[key]}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary mt-6" onClick={onReset}>
                <ResetIcon className="h-5 w-5" /> Reset to baseline
              </button>
            </section>
          )}
          {/* Last child: it is absolutely positioned (sr-only), so it never adds spacing above a card. */}
          <ResultAnnouncer
            hidden={!evaluation.ok}
            message={
              evaluation.ok ? resultAnnouncement(evaluation.results) : 'Results hidden until the highlighted inputs are fixed.'
            }
          />
        </KeepHeight>
      </div>
    </div>
  );
}
