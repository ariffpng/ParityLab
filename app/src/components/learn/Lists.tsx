import { useId, useState } from 'react';
import type { Results } from '../../lib/finance';
import { formatDecimal, formatPctChange, formatSpotUnit } from '../../lib/format';
import { learnRoute } from '../../routes';
import { GLOSSARY } from '../../content/glossary';
import { LIMITATIONS } from '../../content/limitations';
import { REFERENCES, type Reference } from '../../content/references';
import { NOTATION, EQUATIONS, type EquationId } from '../../content/formulas';
import {
  AI_USE_DISCLOSURE,
  CHALLENGE,
  CLO3,
  CONFUSIONS,
  CONFUSIONS_NOTE,
  COURSE,
  EXPORT_NOTE,
  GROUP_LABEL,
  LINKS_NOTE,
  OBJECTIVES,
  PROGRAMME,
  TEAM_MEMBERS,
} from '../../content/about';
import { ChevronIcon, SearchIcon } from '../Icons';
import { RouteLink } from '../RouteLink';
import { Tex } from '../Tex';

/* ---------- Glossary ---------- */

/** Glossary with a filter box. */
export function GlossaryList() {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const q = query.trim().toLowerCase();
  const items = GLOSSARY.filter((g) => !q || `${g.term} ${g.definition}`.toLowerCase().includes(q));
  return (
    <div>
      <label htmlFor={inputId} className="text-base font-semibold text-ink">
        Filter terms
      </label>
      <div className="relative mt-2">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field pl-12 text-left text-base font-normal"
          placeholder="e.g. forward"
          autoComplete="off"
        />
      </div>
      <p className="mt-2 text-sm text-ink-2" aria-live="polite">
        {items.length} of {GLOSSARY.length} terms
      </p>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((g) => (
          <div key={g.term} className="rounded-xl border border-line bg-surface p-4">
            <dt className="font-bold text-ink">{g.term}</dt>
            <dd className="mt-1 text-ink-2">{g.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Symbols table with the learner's current values (no values when the inputs are invalid). */
export function NotationTable({ r }: { r: Results | null }) {
  const values: string[] = r
    ? [
        formatSpotUnit(r.spot),
        formatSpotUnit(r.pppSpot),
        formatSpotUnit(r.cipForward),
        formatSpotUnit(r.ifeSpot),
        `${formatDecimal(r.piMY)}, ${formatDecimal(r.piUS)}`,
        r.rMY === r.rUS ? formatDecimal(r.rMY) : `${formatDecimal(r.rMY)}, ${formatDecimal(r.rUS)}`,
        `${formatDecimal(r.nominalMYPct / 100)}, ${formatDecimal(r.nominalUSPct / 100)}`,
        formatPctChange(r.quoteChangePct),
      ]
    : [];
  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[36rem]">
        <caption className="sr-only">Symbols used in ParityLab{r ? ', with your current values' : ''}</caption>
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Meaning</th>
            <th scope="col">Unit</th>
            {r && <th scope="col">Your value</th>}
          </tr>
        </thead>
        <tbody>
          {NOTATION.map((n, k) => (
            <tr key={n.tex}>
              <td>
                <Tex tex={n.tex} />
              </td>
              <td>{n.meaning}</td>
              <td>{n.unit}</td>
              {r && <td className="tabular whitespace-nowrap">{values[k]}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Equations ---------- */

export function EquationList({ ids }: { ids: EquationId[] }) {
  return (
    <div className="space-y-4">
      {ids.map((id) => {
        const eq = EQUATIONS[id];
        return (
          <div key={id} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-bold text-ink">{eq.name}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-ink-3">Exact</p>
            <Tex display tex={eq.exact} />
            {eq.approx && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Approximation (comparison only)</p>
                <Tex display tex={eq.approx} />
              </>
            )}
            {eq.note && <p className="mt-1 text-sm text-ink-2">{eq.note}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Limitations ---------- */

/** Each limitation expands to why it matters and the safeguard ParityLab uses. */
export function LimitationCards() {
  // Cards open and close independently, so opening one never collapses (and moves) another.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const baseId = useId();
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {LIMITATIONS.map((l, k) => {
        const isOpen = open.has(k);
        return (
          <li key={l.limitation} className={`rounded-xl border bg-surface ${isOpen ? 'border-ink' : 'border-line'}`}>
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-2 text-left font-bold text-ink"
              aria-expanded={isOpen}
              aria-controls={`${baseId}-${k}`}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(k)) next.delete(k);
                  else next.add(k);
                  return next;
                })
              }
            >
              {l.limitation}
              <ChevronIcon className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div id={`${baseId}-${k}`} hidden={!isOpen} className="space-y-2 px-4 pb-4 text-sm">
              <p className="text-ink">
                <span className="font-bold">Why it matters: </span>
                {l.why}
              </p>
              <p className="text-ink-2">
                <span className="font-bold text-ink">Safeguard here: </span>
                {l.safeguard}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- About ---------- */

/** CLO3 in one picture: the three variables and the theory that links each pair. */
export function ParityTriangle() {
  const node =
    'card flex min-h-16 items-center justify-center px-4 py-2 text-center font-bold text-ink no-underline hover:border-ink';
  return (
    <figure className="m-0">
      <div className="relative mx-auto grid max-w-lg grid-cols-2 gap-x-16 gap-y-16">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="50"
            y1="18"
            x2="22"
            y2="82"
            stroke="var(--color-line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="50"
            y1="18"
            x2="78"
            y2="82"
            stroke="var(--color-line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="28"
            y1="86"
            x2="72"
            y2="86"
            stroke="var(--color-line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <RouteLink to={learnRoute('ppp')} className={`${node} relative col-span-2 mx-auto w-48`}>
          Inflation
        </RouteLink>
        <RouteLink to={learnRoute('fisher')} className={`${node} relative`}>
          Interest rates
        </RouteLink>
        <RouteLink to={learnRoute('covered-irp')} className={`${node} relative`}>
          Exchange rate
        </RouteLink>
        <span className="absolute left-[18%] top-[40%] text-sm font-semibold text-ink-2">Fisher</span>
        <span className="absolute right-[20%] top-[40%] text-sm font-semibold text-ink-2">PPP</span>
        <span className="absolute bottom-[-0.25rem] left-1/2 -translate-x-1/2 text-sm font-semibold text-ink-2">IRP · IFE</span>
      </div>
      <figcaption className="mt-8 text-center text-ink-2">CLO3: {CLO3}</figcaption>
    </figure>
  );
}

function ReferenceText({ r }: { r: Reference }) {
  const after = r.rest ? (r.rest.startsWith('.') ? r.rest : ` ${r.rest}`) : '.';
  return (
    <span>
      {r.authors} <em>{r.title}</em>
      {after}{' '}
      {r.url && (
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-all underline">
          {r.url}
        </a>
      )}
    </span>
  );
}

/** Audience, objectives, confusions, references and the About block (moved from v1). */
export function AboutContent() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-bold text-ink">What you will be able to do</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {OBJECTIVES.map((o) => (
            <li key={o.verb} className="rounded-xl border border-line bg-surface p-4">
              <span className="font-bold text-ink">{o.verb}:</span> <span className="text-ink-2">{o.text}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-bold text-ink">Three common confusions it targets</h3>
        <ul className="mt-4 space-y-2">
          {CONFUSIONS.map((c) => (
            <li key={c.title} className="text-ink">
              <span className="font-bold">{c.title}:</span> <span className="text-ink-2">{c.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink-3">{CONFUSIONS_NOTE}</p>
      </section>
      <section>
        <h3 className="text-lg font-bold text-ink">References</h3>
        <ul className="mt-4 space-y-4">
          {REFERENCES.map((r) => (
            <li key={r.id} className="pl-6 -indent-6 text-ink">
              <ReferenceText r={r} />
              <span className="mt-1 block indent-0 text-sm text-ink-3">Used for: {r.usedFor}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-2">{LINKS_NOTE}</p>
      </section>
      <section>
        <h3 className="text-lg font-bold text-ink">About this project</h3>
        <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">Course</dt>
          <dd>{COURSE}</dd>
          <dt className="font-semibold">Assessment</dt>
          <dd>{CHALLENGE}</dd>
          <dt className="font-semibold">Group</dt>
          <dd>{GROUP_LABEL}</dd>
          <dt className="font-semibold">Team members</dt>
          <dd>
            <ul>
              {TEAM_MEMBERS.map((m) => (
                <li key={m.id}>
                  {m.name} ({m.id})
                </li>
              ))}
            </ul>
          </dd>
          <dt className="font-semibold">Programme</dt>
          <dd>{PROGRAMME}</dd>
          <dt className="font-semibold">Calculation checks</dt>
          <dd>
            The TypeScript engine is unit-tested against the reference values and cross-checked with a separately written Python{' '}
            <code>decimal</code> script (see the project’s <code>verification/</code> folder).
          </dd>
          <dt className="font-semibold">Exports</dt>
          <dd>{EXPORT_NOTE}</dd>
          <dt className="font-semibold">AI-use disclosure</dt>
          <dd>{AI_USE_DISCLOSURE}</dd>
        </dl>
      </section>
    </div>
  );
}
