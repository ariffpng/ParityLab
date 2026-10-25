import { useEffect, useRef } from 'react';
import type { Route, View } from '../routes';
import { DISCLAIMER } from '../lib/interpretation';
import { InfoIcon } from './Icons';
import { RouteLink } from './RouteLink';

const NAV: { view: View; label: string }[] = [
  { view: 'home', label: 'Home' },
  { view: 'simulator', label: 'Simulator' },
  { view: 'compare', label: 'Compare' },
  { view: 'quiz', label: 'Quiz' },
  { view: 'learn', label: 'Learn More' },
];

type Props = {
  route: Route;
};

/**
 * Header: a three-column grid above 768 px (logo · centred nav · empty column
 * that balances the logo), so the nav sits at the true centre of the header. At
 * 768 px and below: logo on row 1, the centred nav on row 2. Nav labels never
 * wrap; if the row is too narrow it scrolls sideways with the active tab in view.
 */
export function AppHeader({ route }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
  }, [route.view]);

  return (
    <header className="no-print on-dark bg-ink text-on-panel">
      <div className="page grid grid-cols-1 items-center gap-x-4 gap-y-1 py-2 min-[769px]:grid-cols-[1fr_auto_1fr] min-[769px]:py-3">
        <RouteLink
          to={{ view: 'home' }}
          className="flex items-center gap-2 justify-self-start rounded-lg text-lg font-bold no-underline"
        >
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
            <path
              d="M8 22 L14 14 L18 18 L24 10"
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ParityLab
        </RouteLink>
        <nav
          aria-label="Main"
          className="row-start-2 min-w-0 min-[769px]:col-start-2 min-[769px]:row-start-1"
        >
          <ul
            ref={listRef}
            className="no-scrollbar relative flex [justify-content:safe_center] max-[769px]:-mx-4 max-[769px]:overflow-x-auto max-[769px]:px-2 min-[769px]:gap-2"
          >
            {NAV.map((item) => {
              const active = item.view === route.view;
              return (
                <li key={item.view} className="shrink-0">
                  <RouteLink
                    to={{ view: item.view }}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-2 text-center text-sm font-semibold no-underline [outline-offset:-3px] min-[769px]:px-4 min-[769px]:text-base ${active ? 'bg-panel-2 text-on-panel shadow-[inset_0_-3px_0_var(--color-accent)]' : 'text-on-panel-2 hover:bg-panel-2 hover:text-on-panel'}`}
                  >
                    {item.label}
                  </RouteLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** The mandatory notice: a slim, calm strip that is always visible on every screen. */
export function DisclaimerStrip() {
  return (
    <div className="border-b border-line bg-notice-soft" role="note" aria-label="Model notice">
      <p className="page flex items-start gap-2 py-2 text-sm font-semibold text-notice-ink">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span data-testid="disclaimer">{DISCLAIMER}</span>
      </p>
    </div>
  );
}
