import type { Trace } from '../lib/traces';
import { Tex } from './Tex';

/** A formula trace from traces.ts: general formula → numbers substituted → result. */
export function TraceSteps({ trace, title, stepClassName = '' }: { trace: Trace; title?: string; stepClassName?: string }) {
  return (
    <section className="mt-6 first:mt-0">
      {title && <h3 className="mb-2 text-base font-bold text-ink">{title}</h3>}
      <ol className="space-y-2">
        {trace.steps.map((step, k) => (
          <li key={k} className={`rounded-xl bg-surface-2 px-4 py-2 ${stepClassName}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-3">
              {k + 1}. {step.label}
            </p>
            <Tex tex={step.tex} display className="text-ink" />
          </li>
        ))}
      </ol>
      {trace.note && <p className="mt-2 text-sm text-ink-2">{trace.note}</p>}
    </section>
  );
}
