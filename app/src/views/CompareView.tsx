import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Evaluation } from '../lib/evaluate';
import type { RawInputs, FieldKey } from '../lib/validation';
import { PRESETS, type PresetId } from '../lib/scenarios';
import type { NamedScenario } from '../lib/exportSummary';
import { activePresetId } from '../lib/chips';
import { formatInputPct, formatSpot } from '../lib/format';
import { learnRoute } from '../routes';
import { EXPORT_NOTE } from '../content/about';
import { ComparisonTable, SimpleCompareTable } from '../components/ComparisonTable';
import { DumbbellChart } from '../components/DumbbellChart';
import { RateField, SpotField } from '../components/Fields';
import { Heatmap } from '../components/Heatmap';
import { AlertIcon, ChevronIcon, CopyIcon, DownloadIcon, LockIcon } from '../components/Icons';
import { PresetChips } from '../components/PresetChips';
import { LearnMoreLink } from '../components/RouteLink';
import { SensitivityCurve } from '../components/SensitivityCurve';
import { SensitivityTable } from '../components/SensitivityTable';
import { PageBand } from '../components/PageBand';

export type CompareTab = 'curve' | 'heatmap' | 'six';

type Props = {
  a: NamedScenario;
  bLabel: string;
  bRaw: RawInputs;
  bEval: Evaluation;
  onBRawChange: (next: RawInputs) => void;
  onBPreset: (id: PresetId) => void;
  tab: CompareTab;
  onTab: (t: CompareTab) => void;
  onCopySummary: () => void;
  onDownloadCsv: () => void;
};

const TABS: { id: CompareTab; label: string }[] = [
  { id: 'curve', label: 'Curve' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'six', label: 'Six scenarios' },
];

export function CompareView(props: Props) {
  const { a, bLabel, bRaw, bEval } = props;
  const b: NamedScenario | null = bEval.ok ? { label: bLabel, inputs: bEval.inputs, results: bEval.results } : null;
  const [allRows, setAllRows] = useState(false);
  const allRowsId = useId();

  return (
    <>
      <PageBand title="Compare scenarios" />
      <div className="page space-y-6 pb-16 pt-8">
        <ScenarioACard />
        <ScenarioBEditor label={bLabel} raw={bRaw} evaluation={bEval} onChange={props.onBRawChange} onPreset={props.onBPreset} />

        {b ? (
          <>
            <section className="card p-6" aria-labelledby="dumbbell-heading" id="compare-chart">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="dumbbell-heading" className="text-lg font-bold text-ink">
                  Today → in one year
                </h2>
                <LearnMoreLink to={learnRoute('reading-rates')} about="reading exchange rates" />
              </div>
              <div className="mt-4">
                <DumbbellChart
                  lanes={[a, b].map((s, k) => ({
                    key: k === 0 ? 'A' : 'B',
                    label: s.label,
                    spot: s.results.spot,
                    ppp: s.results.pppSpot,
                    quoteChangePct: s.results.quoteChangePct,
                    direction: s.results.myrDirection,
                  }))}
                />
              </div>
            </section>

            <section className="card p-6" aria-labelledby="table-heading">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="table-heading" className="mr-auto text-lg font-bold text-ink">
                  What changed
                </h2>
                <button
                  type="button"
                  className="btn btn-sm"
                  aria-expanded={allRows}
                  aria-controls={allRowsId}
                  onClick={() => setAllRows((s) => !s)}
                >
                  <ChevronIcon className={`h-4 w-4 transition-transform ${allRows ? 'rotate-180' : ''}`} />
                  Show all rows
                </button>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={props.onCopySummary}
                  aria-label="Copy scenario summary"
                  title={`Copy scenario summary. ${EXPORT_NOTE}`}
                >
                  <CopyIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={props.onDownloadCsv}
                  aria-label="Download CSV"
                  title={`Download CSV. ${EXPORT_NOTE}`}
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4" id={allRowsId}>
                {allRows ? <ComparisonTable a={a} b={b} /> : <SimpleCompareTable a={a} b={b} />}
              </div>
              <div className="mt-4">
                <LearnMoreLink to={learnRoute('six-scenarios')} about="comparing scenarios" />
              </div>
            </section>

            <TabsCard tab={props.tab} onTab={props.onTab} b={b} raw={bRaw} onChange={props.onBRawChange} />
          </>
        ) : (
          <section className="card border-2 border-error p-6" data-testid="results-hidden">
            <h2 className="flex items-center gap-2 text-lg font-bold text-error">
              <AlertIcon className="h-5 w-5" /> Comparison hidden
            </h2>
            <p className="mt-2 text-ink-2">Fix the highlighted Scenario B field to see the comparison.</p>
          </section>
        )}
      </div>
    </>
  );
}

const FIELDS: { key: FieldKey; label: string; dot?: 'my' | 'us' }[] = [
  { key: 'myInflation', label: 'Malaysia inflation', dot: 'my' },
  { key: 'usInflation', label: 'US inflation', dot: 'us' },
];

/** Scenario A: the locked baseline preset, read-only, on Scenario B's card spacing and grid. */
function ScenarioACard() {
  const { name, inputs } = PRESETS.A;
  const items: { label: string; value: string; dot?: 'my' | 'us'; aside?: string }[] = [
    { label: 'Malaysia inflation', value: formatInputPct(inputs.myInflationPct), dot: 'my' },
    { label: 'US inflation', value: formatInputPct(inputs.usInflationPct), dot: 'us' },
    { label: 'Real interest rate', value: formatInputPct(inputs.realRatePct) },
    { label: "Today's rate", value: `US$1 = RM ${formatSpot(inputs.spotMyrPerUsd)}`, aside: 'hypothetical' },
  ];

  return (
    <section className="card p-6" aria-labelledby="a-card-heading" data-testid="scenario-a">
      <h2 id="a-card-heading" className="flex min-w-0 items-center gap-2 text-lg font-bold text-ink">
        <span className="shrink-0">Scenario A</span>
        <span className="tag min-w-0">
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          {name}
          <span className="sr-only">(locked)</span>
        </span>
      </h2>
      <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
              {item.dot && (
                <span className={`h-3 w-3 shrink-0 rounded-full ${item.dot === 'my' ? 'bg-my' : 'bg-us'}`} aria-hidden="true" />
              )}
              {item.label}
              {item.aside && <span className="tag">{item.aside}</span>}
            </dt>
            <dd className="tabular mt-1 text-lg font-semibold text-ink-2">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Compact Scenario B editor: the same preset chips, plus small number fields on demand. */
function ScenarioBEditor({
  label,
  raw,
  evaluation,
  onChange,
  onPreset,
}: {
  label: string;
  raw: RawInputs;
  evaluation: Evaluation;
  onChange: (next: RawInputs) => void;
  onPreset: (id: PresetId) => void;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const set = (patch: Partial<RawInputs>) => onChange({ ...raw, ...patch });
  const show = open || !evaluation.ok;
  const realFields: { key: FieldKey; label: string; dot?: 'my' | 'us' }[] = raw.advanced
    ? [
        { key: 'myRealRate', label: 'Malaysia real rate', dot: 'my' },
        { key: 'usRealRate', label: 'US real rate', dot: 'us' },
      ]
    : [{ key: 'realRate', label: 'Real interest rate' }];

  return (
    <section className="card p-6" aria-labelledby="b-editor-heading">
      <h2 id="b-editor-heading" className="flex min-w-0 items-center gap-2 text-lg font-bold text-ink">
        <span className="shrink-0">Scenario B</span>
        <span className="tag min-w-0 truncate">{label}</span>
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <PresetChips active={activePresetId(evaluation.inputs)} onPick={onPreset} label="Scenario B presets" />
        <button
          type="button"
          className="btn btn-sm ml-auto"
          aria-expanded={show}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronIcon className={`h-4 w-4 transition-transform ${show ? 'rotate-180' : ''}`} />
          Edit numbers
        </button>
      </div>
      <div
        id={bodyId}
        hidden={!show}
        className="mt-6 grid gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AdvancedSwitch raw={raw} set={set} />
        {[...FIELDS, ...realFields].map((f) => (
          <RateField
            key={f.key}
            id={`cmp-field-${f.key}`}
            field={f.key}
            label={f.label}
            dot={f.dot}
            slider={false}
            value={raw[f.key] as string}
            error={evaluation.errors[f.key]}
            onChange={(v) => set({ [f.key]: v })}
          />
        ))}
        <SpotField
          id="cmp-field-spot"
          value={raw.spot}
          error={evaluation.errors.spot}
          onChange={(v) => set({ spot: v })}
          aside={<span className="tag">hypothetical</span>}
        />
      </div>
    </section>
  );
}

function AdvancedSwitch({ raw, set }: { raw: RawInputs; set: (patch: Partial<RawInputs>) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={raw.advanced}
      onClick={() =>
        raw.advanced ? set({ advanced: false }) : set({ advanced: true, myRealRate: raw.realRate, usRealRate: raw.realRate })
      }
      className="flex min-h-11 items-center gap-4 justify-self-start rounded-lg text-left font-semibold text-ink sm:col-span-2 lg:col-span-4"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line-strong transition-colors ${raw.advanced ? 'bg-accent' : 'bg-surface-2'}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-ink transition-transform ${raw.advanced ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </span>
      Separate real rates (advanced)
    </button>
  );
}

function TabsCard({
  tab,
  onTab,
  b,
  raw,
  onChange,
}: {
  tab: CompareTab;
  onTab: (t: CompareTab) => void;
  b: NamedScenario;
  raw: RawInputs;
  onChange: (next: RawInputs) => void;
}) {
  const baseId = useId();
  const refs = useRef<Record<CompareTab, HTMLButtonElement | null>>({ curve: null, heatmap: null, six: null });
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === 'ArrowRight' ? (k + 1) % TABS.length : e.key === 'ArrowLeft' ? (k + TABS.length - 1) % TABS.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onTab(TABS[next].id);
    refs.current[TABS[next].id]?.focus();
  };
  const topic = tab === 'six' ? 'six-scenarios' : 'ppp';

  return (
    <section className="card p-6" aria-label="Sensitivity">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Sensitivity views" className="inline-flex rounded-xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-${t.id}-tab`}
              aria-selected={tab === t.id}
              aria-controls={`${baseId}-${t.id}-panel`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => onTab(t.id)}
              onKeyDown={onKey}
              className={`min-h-10 rounded-lg px-4 text-sm font-bold ${tab === t.id ? 'bg-ink text-on-panel shadow' : 'text-ink-2 hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <LearnMoreLink to={learnRoute(topic)} about={topic === 'ppp' ? 'Purchasing Power Parity' : 'the six example scenarios'} />
      </div>
      {/* The card takes the height of the open tab (no reserved space); the tab buttons never move. */}
      <div className="mt-6">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <div
              key={t.id}
              role="tabpanel"
              id={`${baseId}-${t.id}-panel`}
              aria-labelledby={`${baseId}-${t.id}-tab`}
              className="min-w-0"
              hidden={!active}
            >
              {active && t.id === 'curve' && (
                <SensitivityCurve
                  myInflationPct={b.inputs.myInflationPct}
                  spot={b.inputs.spotMyrPerUsd}
                  usInflationPct={b.inputs.usInflationPct}
                  onChange={(v) => onChange({ ...raw, usInflation: String(v) })}
                />
              )}
              {active && t.id === 'heatmap' && (
                <Heatmap
                  spot={b.inputs.spotMyrPerUsd}
                  current={{ myPct: b.inputs.myInflationPct, usPct: b.inputs.usInflationPct }}
                  onPick={(my, us) => onChange({ ...raw, myInflation: String(my), usInflation: String(us) })}
                />
              )}
              {active && t.id === 'six' && <SensitivityTable />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
