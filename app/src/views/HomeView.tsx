import { calculate } from '../lib/finance';
import { formatSpot } from '../lib/format';
import { BASELINE } from '../lib/scenarios';
import { TAGLINE } from '../content/about';
import { DirectionBadge } from '../components/DirectionBadge';
import { ArrowRightIcon, PercentIcon, PlayIcon, SlidersIcon, SwapIcon } from '../components/Icons';
import { RouteLink } from '../components/RouteLink';
import { learnRoute, type Route } from '../routes';
import { SeeSaw } from '../components/SeeSaw';

const base = calculate(BASELINE);

const STEPS: { icon: typeof SlidersIcon; label: string; to: Route; more: string }[] = [
  { icon: SlidersIcon, label: 'Change inflation', to: { view: 'simulator' }, more: 'Open the simulator' },
  { icon: PercentIcon, label: 'Interest rates react', to: learnRoute('fisher'), more: 'Learn more about the Fisher Effect' },
  { icon: SwapIcon, label: 'Ringgit moves', to: learnRoute('ppp'), more: 'Learn more about Purchasing Power Parity' },
];

/** Home: headline + live see-saw (Z-pattern), a 3-step icon strip, then the two actions. */
export function HomeView({ onStartLesson }: { onStartLesson: () => void }) {
  return (
    <div>
      <section className="on-dark bg-ink text-on-panel">
        <div className="page grid-12 items-center py-12 lg:py-16">
          <div className="col-span-12 lg:col-span-7">
            <h1 tabIndex={-1} className="view-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              See how inflation moves exchange rates.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-on-panel-2">{TAGLINE}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" className="btn btn-primary btn-lg" onClick={onStartLesson}>
                <PlayIcon className="h-5 w-5" /> Start guided lesson
              </button>
              <RouteLink to={{ view: 'simulator' }} className="btn btn-lg btn-dark">
                Open simulator
              </RouteLink>
            </div>
          </div>
          <figure
            className="col-span-12 m-0 rounded-2xl bg-surface p-6 text-ink shadow-xl lg:col-span-5"
            aria-label="How to read MYR/USD"
          >
            <SeeSaw
              spot={base.spot}
              ppp={base.pppSpot}
              quoteChangePct={base.quoteChangePct}
              myrValueChangePct={base.myrValueChangePct}
              direction={base.myrDirection}
              settle
              className="mx-auto max-w-sm"
            />
            <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-lg font-semibold tabular">
              <span>
                US$1 = RM {formatSpot(base.spot)} <span aria-hidden="true">→</span>
                <span className="sr-only"> becomes </span> RM {formatSpot(base.pppSpot)}
              </span>
              <DirectionBadge direction={base.myrDirection} />
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="page py-12">
        <ol className="grid gap-6 sm:grid-cols-3" aria-label="How ParityLab works">
          {STEPS.map(({ icon: Icon, label, to, more }, k) => (
            <li key={label} className="relative">
              <RouteLink
                to={to}
                className="card flex h-full items-center gap-4 p-6 no-underline transition-colors hover:border-ink"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-ink"
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-lg font-bold text-ink">
                  <span className="sr-only">Step {k + 1}: </span>
                  {label}
                  <span className="sr-only"> — {more}</span>
                </span>
                <ArrowRightIcon className="ml-auto h-5 w-5 shrink-0 text-ink-3" />
              </RouteLink>
              {k < STEPS.length - 1 && (
                <ArrowRightIcon className="absolute -right-5 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 text-ink-2 sm:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
