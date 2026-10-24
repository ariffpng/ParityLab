import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { evaluate, type Evaluation } from '../lib/evaluate';
import { calculate, type Inputs, type Results } from '../lib/finance';
import { inputsToRaw, type RawInputs } from '../lib/validation';
import { approxVerdict, CANNOT_CLAIM, interpret, SCENARIO_B_CAVEAT } from '../lib/interpretation';
import { BASELINE, PRESETS } from '../lib/scenarios';
import { cipTrace, fisherTrace, ifeTrace, parityTrace, pppTrace, approxTrace } from '../lib/traces';
import { MODEL_ASSUMPTIONS, TESTS_NOTE } from '../content/about';
import {
  getTopic,
  neighbours,
  readingMinutes,
  TOPIC_GROUPS,
  TOPICS,
  type Topic,
  type TopicIcon,
  type TopicId,
} from '../content/topics';
import { learnRoute } from '../routes';
import { AdvancedLab } from '../components/learn/AdvancedLab';
import { CancelAnimation } from '../components/learn/CancelAnimation';
import { ApproxExplorer, FisherLab, IfeTimeline, RateExplorer } from '../components/learn/Explorers';
import {
  AboutContent,
  EquationList,
  GlossaryList,
  LimitationCards,
  NotationTable,
  ParityTriangle,
} from '../components/learn/Lists';
import { ShoppingBasket } from '../components/learn/ShoppingBasket';
import { TwoRoutes } from '../components/learn/TwoRoutes';
import { DumbbellChart } from '../components/DumbbellChart';
import { SensitivityTable } from '../components/SensitivityTable';
import { KeepHeight } from '../components/KeepHeight';
import { TraceSteps } from '../components/TraceSteps';
import { RichText } from '../components/RichText';
import { RouteLink } from '../components/RouteLink';
import { PageBand } from '../components/PageBand';
import {
  AlertIcon,
  ApproxIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BasketIcon,
  BookIcon,
  EqualIcon,
  InfoIcon,
  LabIcon,
  PercentIcon,
  RouteIcon,
  ShieldIcon,
  SwapIcon,
  TableIcon,
  TelescopeIcon,
} from '../components/Icons';

type Props = { topic?: TopicId; simEval: Evaluation; onOpenInSimulator: (raw: RawInputs) => void };

const ICONS: Record<TopicIcon, ComponentType<{ className?: string }>> = {
  swap: SwapIcon,
  percent: PercentIcon,
  approx: ApproxIcon,
  book: BookIcon,
  basket: BasketIcon,
  route: RouteIcon,
  telescope: TelescopeIcon,
  equal: EqualIcon,
  lab: LabIcon,
  table: TableIcon,
  shield: ShieldIcon,
  info: InfoIcon,
};

export function LearnView({ topic, simEval, onOpenInSimulator }: Props) {
  return topic ? (
    <TopicPage key={topic} topic={getTopic(topic)} simEval={simEval} onOpenInSimulator={onOpenInSimulator} />
  ) : (
    <Hub />
  );
}

/* ---------- Hub ---------- */

function Hub() {
  return (
    <>
      <PageBand title="Learn More">
        <p className="mt-2 text-lg text-on-panel-2">Short topics, from the basics to the deeper theory.</p>
      </PageBand>
      <div className="page pb-16">
        {TOPIC_GROUPS.map((group) => (
          <section key={group.id} className="mt-12" aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="text-xl font-bold text-ink">
              {group.title}
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TOPICS.filter((t) => t.group === group.id).map((t) => (
                <li key={t.id}>
                  <TopicCard topic={t} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  const Icon = ICONS[topic.icon];
  return (
    <RouteLink
      to={learnRoute(topic.id)}
      className="card group flex h-full flex-col p-6 no-underline transition-colors hover:border-ink"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-ink" aria-hidden="true">
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-4 text-lg font-bold text-ink group-hover:underline">{topic.title}</span>
      <span className="mt-2 text-base text-ink-2">{topic.teaser}</span>
      <span className="tag mt-4 self-start">{readingMinutes(topic)} min read</span>
    </RouteLink>
  );
}

/* ---------- Topic page (shared template) ---------- */

function TopicPage({
  topic,
  simEval,
  onOpenInSimulator,
}: {
  topic: Topic;
  simEval: Evaluation;
  onOpenInSimulator: (raw: RawInputs) => void;
}) {
  const { prev, next } = neighbours(topic.id);
  const group = TOPIC_GROUPS.find((g) => g.id === topic.group)!;
  const r = simEval.ok ? simEval.results : null;
  // Visuals start from the learner's simulator numbers, or the baseline if those are invalid.
  const base: Inputs = simEval.ok ? simEval.inputs : BASELINE;
  const baseResults: Results = r ?? calculate(BASELINE);

  // Advanced lab: separate real rates on top of the simulator's inflation and spot.
  const [labRaw, setLabRaw] = useState<RawInputs>(() => ({
    ...inputsToRaw({
      ...base,
      advanced: true,
      myRealRatePct: PRESETS.ADV.inputs.myRealRatePct,
      usRealRatePct: PRESETS.ADV.inputs.usRealRatePct,
    }),
  }));
  const labEval = useMemo(() => evaluate(labRaw), [labRaw]);

  return (
    <>
      <section className="on-dark bg-ink text-on-panel">
        <div className="page grid-12 py-8 lg:py-12">
          <div className="col-span-12 lg:col-span-8">
            <nav aria-label="Breadcrumb" className="text-sm text-on-panel-2">
              <RouteLink to={{ view: 'learn' }} className="link-more">
                Learn More
              </RouteLink>{' '}
              / {group.title}
            </nav>
            <h1 id="topic-title" tabIndex={-1} className="view-heading mt-4 text-2xl font-bold">
              {topic.title}
            </h1>
            <span className="tag tag-dark mt-4">{readingMinutes(topic)} min read</span>
            <div className="mt-6 space-y-2 text-lg text-on-panel-2">
              {topic.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="page pb-16">
        <div className="grid-12">
          <article className="col-span-12 min-w-0 lg:col-span-8" aria-labelledby="topic-title">
            {topic.id !== 'glossary' && (
              <section className="card mt-8 p-6" aria-label="Interactive visual">
                <TopicVisual
                  topic={topic.id}
                  r={baseResults}
                  base={base}
                  labRaw={labRaw}
                  labEval={labEval}
                  onLabChange={setLabRaw}
                  onOpenInSimulator={onOpenInSimulator}
                />
              </section>
            )}
            {topic.id === 'glossary' && (
              <section className="card mt-8 p-6" aria-label="Glossary">
                <GlossaryList />
              </section>
            )}

            {topic.id !== 'about' && (
              <Block title="With your current numbers">
                <CurrentNumbers topic={topic.id} r={r} inputs={simEval.ok ? simEval.inputs : null} labEval={labEval} />
              </Block>
            )}

            <Block title="In more detail">
              <div className="space-y-4 text-ink">
                {topic.details.map((d) => (
                  <p key={d}>{d}</p>
                ))}
              </div>
              {topic.equations.length > 0 && (
                <div className="mt-6">
                  <EquationList ids={topic.equations} />
                </div>
              )}
              <TopicExtra topic={topic.id} />
            </Block>

            <Block title="Key assumptions">
              <ul className="list-disc space-y-2 pl-6 text-ink">
                {topic.assumptions.slice(0, 3).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Block>

            <nav
              aria-label="Topic navigation"
              className="mt-12 flex flex-wrap items-stretch justify-between gap-4 border-t border-line pt-6"
            >
              {prev ? (
                <RouteLink to={learnRoute(prev.id)} className="btn">
                  <ArrowLeftIcon className="h-5 w-5" /> <span className="sr-only">Previous topic: </span>
                  {prev.title}
                </RouteLink>
              ) : (
                <span />
              )}
              {next && (
                <RouteLink to={learnRoute(next.id)} className="btn">
                  <span className="sr-only">Next topic: </span>
                  {next.title} <ArrowRightIcon className="h-5 w-5" />
                </RouteLink>
              )}
            </nav>
            <p className="mt-6">
              <RouteLink to={{ view: 'simulator' }} className="btn btn-primary">
                Back to simulator
              </RouteLink>
            </p>
          </article>

          <aside className="col-span-12 lg:col-span-4" aria-label="All topics">
            <div className="card mt-8 p-6 lg:sticky lg:top-6">
              <p className="text-base font-bold text-ink">All topics</p>
              <ol className="mt-4 space-y-1">
                {TOPICS.map((t, k) => (
                  <li key={t.id}>
                    <RouteLink
                      to={learnRoute(t.id)}
                      aria-current={t.id === topic.id ? 'page' : undefined}
                      className={`flex gap-2 rounded-lg px-2 py-1 text-sm font-semibold no-underline ${t.id === topic.id ? 'bg-accent-soft text-ink' : 'text-ink-2 hover:text-ink hover:underline'}`}
                    >
                      <span className="w-5 shrink-0 tabular text-ink-3">{k + 1}</span>
                      {t.title}
                    </RouteLink>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TopicVisual({
  topic,
  r,
  base,
  labRaw,
  labEval,
  onLabChange,
  onOpenInSimulator,
}: {
  topic: TopicId;
  r: Results;
  base: Inputs;
  labRaw: RawInputs;
  labEval: Evaluation;
  onLabChange: (next: RawInputs) => void;
  onOpenInSimulator: (raw: RawInputs) => void;
}) {
  switch (topic) {
    case 'reading-rates':
      return <RateExplorer spot={r.spot} start={r.pppSpot} />;
    case 'fisher':
      return <FisherLab start={{ realPct: r.rMY * 100, inflationPct: r.piMY * 100 }} />;
    case 'exact-vs-approx':
      return <ApproxExplorer spot={r.spot} myInflationPct={base.myInflationPct} startUs={base.usInflationPct} />;
    case 'ppp':
      return <ShoppingBasket r={r} />;
    case 'covered-irp':
      return <TwoRoutes r={r} />;
    case 'ife':
      return <IfeTimeline r={r} />;
    case 'forward-equals-ppp':
      return <CancelAnimation r={r} />;
    case 'advanced-lab':
      return (
        <AdvancedLab
          raw={labRaw}
          evaluation={labEval}
          onChange={onLabChange}
          onOpenInSimulator={() => onOpenInSimulator(labRaw)}
        />
      );
    case 'six-scenarios':
      return (
        <DumbbellChart
          lanes={(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((id) => {
            const res = calculate(PRESETS[id].inputs);
            return {
              key: id,
              label: PRESETS[id].name,
              spot: res.spot,
              ppp: res.pppSpot,
              quoteChangePct: res.quoteChangePct,
              direction: res.myrDirection,
            };
          })}
        />
      );
    case 'limitations':
      return <LimitationCards />;
    case 'about':
      return <ParityTriangle />;
    case 'glossary':
      return null;
  }
}

function CurrentNumbers({
  topic,
  r,
  inputs,
  labEval,
}: {
  topic: TopicId;
  r: Results | null;
  inputs: Inputs | null;
  labEval: Evaluation;
}) {
  if (topic === 'advanced-lab') {
    // The lab edits its own inputs, so this section keeps its height through every change.
    return (
      <KeepHeight hold={!labEval.ok}>
        {labEval.ok ? <TraceSteps trace={parityTrace(labEval.results)} stepClassName="min-h-24" /> : <Invalid />}
      </KeepHeight>
    );
  }
  if (topic === 'glossary')
    return r ? (
      <NotationTable r={r} />
    ) : (
      <>
        <Invalid />
        <NotationTable r={null} />
      </>
    );
  if (!r || !inputs) return <Invalid />;
  switch (topic) {
    case 'reading-rates':
    case 'ppp':
      return <TraceSteps trace={pppTrace(r)} />;
    case 'fisher':
      return (
        <>
          <TraceSteps trace={fisherTrace(r, 'MY')} title="Malaysia" />
          <TraceSteps trace={fisherTrace(r, 'US')} title="United States" />
        </>
      );
    case 'exact-vs-approx':
      return (
        <>
          <TraceSteps trace={approxTrace(r)} title="PPP change in MYR/USD" />
          <p className="mt-2 font-semibold text-ink">{approxVerdict(r)}</p>
          <TraceSteps trace={fisherTrace(r, 'MY')} title="Fisher (Malaysia)" />
        </>
      );
    case 'covered-irp':
      return <TraceSteps trace={cipTrace(r)} />;
    case 'ife':
      return <TraceSteps trace={ifeTrace(r)} />;
    case 'forward-equals-ppp':
      return <TraceSteps trace={parityTrace(r)} />;
    case 'six-scenarios':
      return <SensitivityTable extra={{ label: 'Your scenario', inputs }} />;
    case 'limitations': {
      const why = interpret(inputs, r);
      return (
        <div className="space-y-4 text-ink">
          <p>
            <RichText text={why.directionMessage} />
          </p>
          <p className="flex gap-2 rounded-xl bg-notice-soft p-4 text-notice-ink">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{why.caveat ?? 'A real inflation surprise can move markets in ways this model does not simulate.'}</span>
          </p>
        </div>
      );
    }
    case 'about':
      return null;
  }
}

function Invalid() {
  return (
    <p className="rounded-xl bg-down-soft p-4 font-semibold text-error">
      Your simulator inputs are not valid right now, so no numbers are shown here. Fix them in the Simulator.
    </p>
  );
}

/** Extra long-form content moved from v1 for some topics. */
function TopicExtra({ topic }: { topic: TopicId }) {
  switch (topic) {
    case 'limitations':
      return (
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-ink">What this model cannot claim</h3>
            <ul className="mt-2 list-disc space-y-2 pl-6 text-ink">
              {CANNOT_CLAIM.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">Scenario B caveat</h3>
            <p className="mt-2 text-ink">{SCENARIO_B_CAVEAT}</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">All model assumptions</h3>
            <ul className="mt-2 list-disc space-y-2 pl-6 text-ink">
              {MODEL_ASSUMPTIONS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <p className="text-ink-2">{TESTS_NOTE}</p>
        </div>
      );
    case 'about':
      return (
        <div className="mt-6">
          <AboutContent />
        </div>
      );
    default:
      return null;
  }
}
