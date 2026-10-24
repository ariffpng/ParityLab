import { useEffect, useId, useRef, useState } from 'react';
import { QUIZ } from '../content/quiz';
import type { QuizState } from '../components/Quiz';
import { learnRoute } from '../routes';
import { ArrowRightIcon, CheckIcon, ChevronIcon, CrossIcon, ResetIcon, TrophyIcon } from '../components/Icons';
import { LearnMoreLink, RouteLink } from '../components/RouteLink';
import { PageBand } from '../components/PageBand';

type Props = { state: QuizState; onChange: (next: QuizState) => void };

const LETTERS = ['A', 'B', 'C', 'D'];
const CONFETTI = ['var(--color-accent)', 'var(--color-my)', 'var(--color-us)', 'var(--color-up)', 'var(--color-down)'];

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
          <span className="tag tag-dark w-28 justify-center text-sm tabular" aria-live="polite">
            Score {score} / {answered.length}
          </span>
        </div>
      </PageBand>
      <div className="page pb-16 pt-8">
        <div className="grid-12">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            {done ? (
              <Finished score={score} total={total} onRestart={() => onChange({ index: 0, answers: {} })} />
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
  const last = state.index === QUIZ.length - 1;
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
      <p className="eyebrow">
        Question {state.index + 1} of {QUIZ.length}
      </p>
      <h2 id={`${item.id}-q`} ref={headingRef} tabIndex={-1} className="mt-2 text-xl font-bold text-ink">
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
          className="fade-in mt-6 rounded-2xl bg-surface p-6 shadow-sm outline-none"
          data-testid="quiz-feedback"
        >
          <p className={`flex items-center gap-2 text-lg font-bold ${correct ? 'text-up-ink' : 'text-down-ink'}`}>
            {correct ? <CheckIcon className="h-5 w-5" /> : <CrossIcon className="h-5 w-5" />}
            {correct ? 'Correct.' : `Not quite. The answer is: ${correctText}.`}
          </p>
          <p className="mt-2 text-ink">{item.feedback}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <LearnMoreLink to={learnRoute(item.topic)} label="See why" />
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
              onClick={() => onChange({ ...state, index: state.index + 1 })}
            >
              {last ? 'See your score' : 'Next question'} <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div id={calcId} hidden={!showCalc}>
            {showCalc && (
              <div className="mt-4 rounded-xl bg-surface-2 p-4">
                <p className="text-sm text-ink">{item.explanation}</p>
                <ul className="mt-2 space-y-1 font-mono text-sm text-ink">
                  {item.calculation().map((line) => (
                    <li key={line}>{line}</li>
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

function Finished({ score, total, onRestart }: { score: number; total: number; onRestart: () => void }) {
  const perfect = score === total;
  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-ink p-8 text-center text-on-panel on-dark"
      data-testid="quiz-done"
      aria-labelledby="quiz-done-h"
    >
      <div aria-hidden="true">
        {Array.from({ length: 24 }, (_, k) => (
          <span
            key={k}
            className="confetti"
            style={{ left: `${(k * 37) % 100}%`, background: CONFETTI[k % CONFETTI.length], animationDelay: `${(k % 8) * 90}ms` }}
          />
        ))}
      </div>
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-on-accent">
        <TrophyIcon className="h-10 w-10" />
      </span>
      <h2 id="quiz-done-h" className="mt-4 text-2xl font-extrabold">
        Final score: {score} / {total}
      </h2>
      <p className="mt-2 text-lg text-on-panel-2">
        {perfect ? 'Every answer right — well done.' : 'Review the topics behind any misses, then try again.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button type="button" className="btn btn-primary btn-lg" onClick={onRestart}>
          <ResetIcon className="h-5 w-5" /> Try again
        </button>
        <RouteLink to={{ view: 'learn' }} className="btn btn-lg btn-dark">
          Learn More
        </RouteLink>
      </div>
      <p className="mt-6 text-sm text-on-panel-2">
        Answers are kept only while this page is open; nothing is stored or sent anywhere.
      </p>
    </section>
  );
}
