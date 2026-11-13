import { useEffect, useId, useRef, useState } from 'react';
import { QUIZ } from '../content/quiz';
import { getTopic } from '../content/topics';
import type { QuizState } from '../components/Quiz';
import { learnRoute } from '../routes';
import { ArrowRightIcon, CheckIcon, ChevronIcon, CrossIcon, ResetIcon } from '../components/Icons';
import { RichText } from '../components/RichText';
import { Stack } from '../components/Stack';
import { LearnMoreLink, RouteLink } from '../components/RouteLink';
import { PageBand } from '../components/PageBand';

type Props = { state: QuizState; onChange: (next: QuizState) => void };

const LETTERS = ['A', 'B', 'C', 'D'];

/** The next question after `from` that has no answer yet (QUIZ.length when none is left). */
function nextOpen(answers: Record<string, string>, from: number): number {
  for (let k = from + 1; k < QUIZ.length; k += 1) if (answers[QUIZ[k].id] === undefined) return k;
  return QUIZ.length;
}

/** One question per screen; feedback appears only after the learner answers. */
export function QuizView({ state, onChange }: Props) {
  const total = QUIZ.length;
  const answered = QUIZ.filter((q) => state.answers[q.id] !== undefined);
  const score = answered.filter((q) => state.answers[q.id] === q.correct).length;
  const done = state.index >= total;

  return (
    <>
      <PageBand title="Quiz">
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div
            className="h-3 min-w-48 flex-1 overflow-hidden rounded-full bg-panel-2"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered.length}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${(answered.length / total) * 100}%` }}
            />
          </div>
<p className="w-32 shrink-0 text-right text-base font-semibold tabular text-on-panel-2">
            {done ? 'Finished' : `Question ${state.index + 1} of ${total}`}
          </p>
        </div>
      </PageBand>
      <div className="page pb-16 pt-8">
        <div className="grid-12">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            {done ? (
              <Finished state={state} score={score} total={total} onChange={onChange} />
            ) : (
              <Question key={QUIZ[state.index].id} state={state} onChange={onChange} autoFocus={state.index > 0} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Question({ state, onChange, autoFocus }: Props & { autoFocus: boolean }) {
  const item = QUIZ[state.index];
  const choice = state.answers[item.id];
  const locked = choice !== undefined;
  const correct = choice === item.correct;
  const correctText = item.options.find((o) => o.id === item.correct)?.text;
  const next = nextOpen(state.answers, state.index);
  const last = next >= QUIZ.length;
  const [showCalc, setShowCalc] = useState(false);
  const calcId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // After "Next question", move focus to the new question for keyboard and screen-reader users.
  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (locked) feedbackRef.current?.focus({ preventScroll: false });
  }, [locked]);

  return (
    <section aria-labelledby={`${item.id}-q`}>
      <h2 id={`${item.id}-q`} ref={headingRef} tabIndex={-1} className="text-xl font-bold text-ink">
        {item.question}
      </h2>
      <div role="group" aria-labelledby={`${item.id}-q`} className="mt-6 grid gap-4">
        {item.options.map((o, k) => {
          const isChoice = choice === o.id;
          const isRight = locked && o.id === item.correct;
          const isWrong = locked && isChoice && !isRight;
          return (
            <button
              key={o.id}
              type="button"
              disabled={locked}
              aria-pressed={isChoice}
              onClick={() => onChange({ ...state, answers: { ...state.answers, [item.id]: o.id } })}
              className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 px-6 py-4 text-left text-lg font-semibold transition-colors ${
                isRight
                  ? 'border-up bg-up-soft text-ink'
                  : isWrong
                    ? 'border-down bg-down-soft text-ink'
                    : locked
                      ? 'border-line bg-surface text-ink-2'
                      : 'border-line bg-surface text-ink hover:border-ink'
              } disabled:cursor-default`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${isRight ? 'bg-up text-surface' : isWrong ? 'bg-down text-surface' : 'bg-surface-2 text-ink'}`}
                aria-hidden="true"
              >
                {isRight ? <CheckIcon className="h-5 w-5" /> : isWrong ? <CrossIcon className="h-5 w-5" /> : LETTERS[k]}
              </span>
              <span className="flex-1">{o.text}</span>
              {/* The status label always has its slot, so answering never re-wraps or resizes an answer. */}
              <span
                className={`w-32 shrink-0 text-right text-sm font-bold ${isRight ? 'text-up-ink' : isWrong ? 'text-down-ink' : 'invisible'}`}
                aria-hidden={isRight || isWrong ? undefined : true}
              >
                {isRight ? 'Correct answer' : isWrong ? 'Your answer' : 'Correct answer'}
              </span>
            </button>
          );
        })}
      </div>

      {locked && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          className="card fade-in mt-6 p-6 outline-none"
          data-testid="quiz-feedback"
        >
          <p className={`flex items-center gap-2 text-lg font-bold ${correct ? 'text-up-ink' : 'text-down-ink'}`}>
            {correct ? <CheckIcon className="h-5 w-5" /> : <CrossIcon className="h-5 w-5" />}
            {correct ? 'Correct.' : `Not quite. The answer is: ${correctText}.`}
          </p>
          <p className="mt-2 text-ink">{item.feedback}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <LearnMoreLink to={learnRoute(item.topic)} about={getTopic(item.topic).title} />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
              aria-expanded={showCalc}
              aria-controls={calcId}
              onClick={() => setShowCalc((s) => !s)}
            >
              <ChevronIcon className={`h-4 w-4 transition-transform ${showCalc ? 'rotate-180' : ''}`} />
              Show calculation
            </button>
            <button
              type="button"
              className="btn btn-primary ml-auto"
              onClick={() => onChange({ ...state, index: next })}
            >
              <Stack inline show={last ? 1 : 0} items={['Next question', 'See your score']} />
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div id={calcId} hidden={!showCalc}>
            {showCalc && (
              <div className="mt-4 rounded-xl bg-surface-2 p-4">
                <p className="text-sm text-ink">
                  <RichText text={item.explanation} />
                </p>
                <ul className="mt-3 space-y-1 text-base tabular text-ink">
                  {item.calculation().map((line) => (
                    <li key={line}>
                      <RichText text={line} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** The end of the quiz: a plain score, then every question with the learner's answer and the right one. */
function Finished({
  state,
  score,
  total,
  onChange,
}: {
  state: QuizState;
  score: number;
  total: number;
  onChange: (next: QuizState) => void;
}) {
  const missed = QUIZ.filter((q) => state.answers[q.id] !== q.correct);
  const retryMissed = () => {
    const answers = { ...state.answers };
    for (const q of missed) delete answers[q.id];
    onChange({ index: QUIZ.indexOf(missed[0]), answers });
  };
  const optionText = (q: (typeof QUIZ)[number], id: string | undefined) => q.options.find((o) => o.id === id)?.text ?? 'No answer';
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section data-testid="quiz-done" aria-labelledby="quiz-done-h">
      <h2 id="quiz-done-h" ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-ink outline-none">
        You scored {score} out of {total}
      </h2>
      <p className="mt-2 text-lg text-ink-2">
        {missed.length === 0
          ? 'Every answer was right.'
          : `Read the topic behind each miss below, then retry ${missed.length === 1 ? 'it' : 'them'}.`}
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        {missed.length > 0 && (
          <button type="button" className="btn btn-primary btn-lg" onClick={retryMissed}>
            <ResetIcon className="h-5 w-5" /> Retry missed questions
          </button>
        )}
        <button
          type="button"
          className={`btn btn-lg ${missed.length === 0 ? 'btn-primary' : ''}`}
          onClick={() => onChange({ index: 0, answers: {} })}
        >
          Start again
        </button>
      </div>

      <ol className="mt-10 divide-y divide-line border-y border-line" aria-label="Your answers">
        {QUIZ.map((q, k) => {
          const right = state.answers[q.id] === q.correct;
          return (
            <li key={q.id} className="grid gap-2 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${right ? 'bg-up-soft text-up-ink' : 'bg-down-soft text-down-ink'}`}
                aria-hidden="true"
              >
                {right ? <CheckIcon className="h-4 w-4" /> : <CrossIcon className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  <span className="sr-only">{right ? 'Right' : 'Missed'}: </span>
                  {k + 1}. {q.question}
                </p>
                {right ? (
                  <p className="mt-1 text-ink-2">Your answer: {optionText(q, state.answers[q.id])}</p>
                ) : (
                  <>
                    <p className="mt-1 text-ink-2">Your answer: {optionText(q, state.answers[q.id])}</p>
                    <p className="mt-1 text-ink">Correct answer: {optionText(q, q.correct)}</p>
                    <p className="mt-2">
                      <LearnMoreLink to={learnRoute(q.topic)} about={getTopic(q.topic).title} />
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6">
        <RouteLink to={{ view: 'learn' }} className="link-more">
          All Learn More topics
        </RouteLink>
      </p>
    </section>
  );
}
