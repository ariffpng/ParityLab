import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from './lib/evaluate';
import { calculate } from './lib/finance';
import { inputsToRaw, type RawInputs } from './lib/validation';
import { BASELINE, PRESETS, type PresetId } from './lib/scenarios';
import { comparisonCsv, comparisonSummaryText, scenarioSummaryText, type NamedScenario } from './lib/exportSummary';
import { FOOTER_NOTE } from './lib/interpretation';
import { CLO3, GROUP_LABEL } from './content/about';
import { LESSON_STEPS } from './content/lesson';
import { AppHeader, DisclaimerStrip } from './components/AppHeader';
import { GuidedLesson, type Prediction } from './components/GuidedLesson';
import { NavContext } from './components/nav';
import type { QuizState } from './components/Quiz';
import { HomeView } from './views/HomeView';
import { SimulatorView } from './views/SimulatorView';
import { CompareView, type CompareTab } from './views/CompareView';
import { QuizView } from './views/QuizView';
import { LearnView } from './views/LearnView';
import { parseHash, sameRoute, toHash, type Route } from './routes';
import { copyText, downloadText, readStorage, writeStorage } from './utils/browser';

const PRESENTATION_KEY = 'paritylab.presentation';
const SCENARIO_A: NamedScenario = { label: PRESETS.A.name, inputs: BASELINE, results: calculate(BASELINE) };

type Lesson = { step: number; prediction: Prediction | null };

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [simRaw, setSimRaw] = useState<RawInputs>(() => inputsToRaw(BASELINE));
  const [cmpRaw, setCmpRaw] = useState<RawInputs>(() => inputsToRaw(PRESETS.B.inputs));
  const [cmpLabel, setCmpLabel] = useState<string>(PRESETS.B.name);
  const [cmpTab, setCmpTab] = useState<CompareTab>('curve');
  const [presentation, setPresentation] = useState<boolean>(() => readStorage(PRESENTATION_KEY) === '1');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<QuizState>({ index: 0, answers: {} });
  // Copy/download feedback is a fixed-position toast, so no control ever moves to make room for it.
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const userNavigated = useRef(false);

  const simEval = useMemo(() => evaluate(simRaw), [simRaw]);
  const cmpEval = useMemo(() => evaluate(cmpRaw), [cmpRaw]);

  // Hash routing: every navigation is a history entry, so Back and Forward work.
  useEffect(() => {
    const onHash = () => {
      userNavigated.current = true;
      setRoute((current) => {
        const next = parseHash(window.location.hash);
        return sameRoute(current, next) ? current : next;
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((to: Route) => {
    userNavigated.current = true;
    setRoute(to);
    if (window.location.hash !== toHash(to)) window.location.hash = toHash(to);
  }, []);

  const routeKey = toHash(route);
  // Move focus to the new screen's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (!userNavigated.current) return;
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('.view-heading')?.focus({ preventScroll: true });
  }, [routeKey]);

  useEffect(() => {
    document.documentElement.classList.toggle('presentation', presentation);
    writeStorage(PRESENTATION_KEY, presentation ? '1' : '0');
  }, [presentation]);

  const lessonStep = lesson && route.view === 'simulator' ? lesson.step : null;
  const lessonPrediction = lesson?.prediction ?? null;
  const highlight = lessonStep === null ? [] : LESSON_STEPS[lessonStep].highlight;

  useEffect(() => {
    if (lessonStep === null) return;
    const first = LESSON_STEPS[lessonStep].highlight[0];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(first)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [lessonStep, lessonPrediction]);

  const startLesson = () => {
    setSimRaw(inputsToRaw(BASELINE));
    setLesson({ step: 0, prediction: null });
    navigate({ view: 'simulator' });
  };

  const notify = (text: string) => setToast({ id: Date.now(), text });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSimPreset = (id: PresetId) => setSimRaw(inputsToRaw(PRESETS[id].inputs));

  const sendToCompare = () => {
    setCmpRaw({ ...simRaw });
    setCmpLabel('From the simulator');
    navigate({ view: 'compare' });
  };

  const copySimSummary = async () => {
    if (!simEval.ok) return;
    const text = scenarioSummaryText({ label: 'Simulator scenario', inputs: simEval.inputs, results: simEval.results });
    notify((await copyText(text)) ? 'Summary copied to the clipboard.' : 'Copy failed — your browser blocked clipboard access.');
  };

  const cmpScenario: NamedScenario | null = cmpEval.ok
    ? { label: cmpLabel, inputs: cmpEval.inputs, results: cmpEval.results }
    : null;

  const copyCmpSummary = async () => {
    if (!cmpScenario) return;
    const ok = await copyText(comparisonSummaryText(SCENARIO_A, cmpScenario));
    notify(ok ? 'Comparison summary copied to the clipboard.' : 'Copy failed — your browser blocked clipboard access.');
  };

  const downloadCmpCsv = () => {
    if (!cmpScenario) return;
    downloadText('paritylab-comparison.csv', comparisonCsv(SCENARIO_A, cmpScenario));
    notify('CSV downloaded (created locally in your browser).');
  };

  const openInSimulator = (raw: RawInputs) => {
    setSimRaw(raw);
    navigate({ view: 'simulator' });
  };

  const lessonActive = lessonStep !== null;

  return (
    <NavContext.Provider value={{ route, navigate }}>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus();
          }}
          className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <AppHeader route={route} presentation={presentation} onTogglePresentation={() => setPresentation((p) => !p)} />
        <DisclaimerStrip />

        <main id="main" tabIndex={-1} className={`flex-1 outline-none ${lessonActive ? 'pb-[60vh]' : ''}`}>
          {route.view === 'home' && <HomeView onStartLesson={startLesson} />}
          {route.view === 'simulator' && (
            <SimulatorView
              raw={simRaw}
              evaluation={simEval}
              onRawChange={setSimRaw}
              onPreset={loadSimPreset}
              onReset={() => loadSimPreset('A')}
              onSendToCompare={sendToCompare}
              onCopySummary={copySimSummary}
              highlight={highlight}
            />
          )}
          {route.view === 'compare' && (
            <CompareView
              a={SCENARIO_A}
              bLabel={cmpLabel}
              bRaw={cmpRaw}
              bEval={cmpEval}
              onBRawChange={(next) => {
                setCmpRaw(next);
                setCmpLabel('Custom');
              }}
              onBPreset={(id) => {
                setCmpRaw(inputsToRaw(PRESETS[id].inputs));
                setCmpLabel(PRESETS[id].name);
              }}
              tab={cmpTab}
              onTab={setCmpTab}
              onCopySummary={copyCmpSummary}
              onDownloadCsv={downloadCmpCsv}
            />
          )}
          {route.view === 'quiz' && <QuizView state={quiz} onChange={setQuiz} />}
          {route.view === 'learn' && <LearnView topic={route.topic} simEval={simEval} onOpenInSimulator={openInSimulator} />}
        </main>

        <footer className="no-print border-t border-line bg-surface">
          <div className="page flex flex-wrap justify-between gap-x-6 gap-y-2 py-6 text-sm text-ink-2">
            <p>{FOOTER_NOTE} Runs entirely in your browser; no data leaves this page.</p>
            <p>
              ParityLab · GFB3043 / GEB3043 · CLO3: {CLO3} · {GROUP_LABEL}
            </p>
          </div>
        </footer>

        <p
          role="status"
          aria-live="polite"
          className={`no-print fixed bottom-6 left-1/2 z-[60] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-on-panel shadow-xl ${toast ? '' : 'invisible'}`}
        >
          {toast?.text}
        </p>

        {lessonActive && lesson && (
          <GuidedLesson
            step={lesson.step}
            prediction={lesson.prediction}
            onBack={() => {
              if (lesson.prediction) setSimRaw(inputsToRaw(BASELINE));
              setLesson({ step: Math.max(0, lesson.step - 1), prediction: null });
            }}
            onNext={() => setLesson({ step: Math.min(LESSON_STEPS.length - 1, lesson.step + 1), prediction: lesson.prediction })}
            onExit={() => setLesson(null)}
            onPredict={(p) => {
              setLesson({ step: lesson.step, prediction: p });
              setSimRaw(inputsToRaw(PRESETS.B.inputs));
            }}
          />
        )}
      </div>
    </NavContext.Provider>
  );
}
