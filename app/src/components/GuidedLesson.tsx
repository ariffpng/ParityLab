import { useEffect, useRef } from 'react';
import { LESSON_REVEAL, LESSON_STEPS } from '../content/lesson';
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, CrossIcon } from './Icons';

export type Prediction = 'rise' | 'fall';

type Props = {
  step: number;
  prediction: Prediction | null;
  onBack: () => void;
  onNext: () => void;
  onExit: () => void;
  onPredict: (p: Prediction) => void;
};

/**
 * Bottom-docked stepper. The highlighted card is scrolled into view by the App.
 * The panel has one fixed size for every step: the step text scrolls inside it,
 * and Back / Next (or Finish) stay at the same place with the same width.
 */
export function GuidedLesson({ step, prediction, onBack, onNext, onExit, onPredict }: Props) {
  const s = LESSON_STEPS[step];
  const total = LESSON_STEPS.length;
  const last = step === total - 1;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  return (
    <aside aria-label="Guided lesson" className="no-print fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="mx-auto flex h-[min(25rem,58vh)] max-w-3xl flex-col rounded-2xl border-2 border-accent bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-6 pt-4 max-sm:px-4">
          <p className="eyebrow">
            Guided lesson · Step {step + 1} of {total}
          </p>
          <button type="button" className="btn btn-sm" onClick={onExit}>
            Exit lesson
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 max-sm:px-4">
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-xl font-bold text-ink">
            {s.title}
          </h2>
          <p className="mt-2 text-lg text-ink">{s.body}</p>

          {s.prediction && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Your prediction">
              <button
                type="button"
                className="btn"
                aria-pressed={prediction === 'rise'}
                disabled={prediction !== null}
                onClick={() => onPredict('rise')}
              >
                <ArrowUpIcon className="h-4 w-4" /> MYR/USD will rise (ringgit weaker)
              </button>
              <button
                type="button"
                className="btn"
                aria-pressed={prediction === 'fall'}
                disabled={prediction !== null}
                onClick={() => onPredict('fall')}
              >
                <ArrowDownIcon className="h-4 w-4" /> MYR/USD will fall (ringgit stronger)
              </button>
            </div>
          )}
          {s.prediction && prediction !== null && (
            <div
              role="status"
              className={`fade-in mt-4 rounded-xl border p-4 ${prediction === LESSON_REVEAL.correct ? 'border-up/50 bg-up-soft' : 'border-down/50 bg-down-soft'}`}
            >
              <p className="flex items-center gap-2 font-bold text-ink">
                {prediction === LESSON_REVEAL.correct ? (
                  <>
                    <CheckIcon className="h-5 w-5 text-up-ink" /> Correct — you predicted a fall.
                  </>
                ) : (
                  <>
                    <CrossIcon className="h-5 w-5 text-down-ink" /> Not quite — you predicted a rise.
                  </>
                )}
              </p>
              <p className="mt-1 text-ink">{LESSON_REVEAL.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4 max-sm:px-4">
          <div className="flex gap-2" aria-hidden="true">
            {LESSON_STEPS.map((_, k) => (
              <span key={k} className={`h-2 w-6 rounded-full max-sm:w-4 ${k <= step ? 'bg-accent' : 'bg-line'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={onBack} disabled={step === 0}>
              Back
            </button>
            <button type="button" className="btn btn-primary min-w-36" onClick={last ? onExit : onNext}>
              {last ? 'Finish lesson' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
