import { useId, useState, type ReactNode } from 'react';
import { InfoIcon } from './Icons';

type Props = {
  /** Accessible name of the ⓘ button, e.g. "About today's rate". */
  label: string;
  children: ReactNode;
  align?: 'start' | 'end';
  dark?: boolean;
};

/**
 * ⓘ tooltip: opens on hover, keyboard focus or tap; Esc dismisses it. The text
 * stays in the DOM (hidden when closed) so it is also the button's description.
 */
export function InfoTip({ label, children, align = 'start', dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${dark ? 'text-on-panel-2 hover:text-on-panel' : 'text-ink-2 hover:text-ink'}`}
      >
        <InfoIcon className="h-5 w-5" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        hidden={!open}
        className={`absolute top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-4 text-left text-sm font-normal normal-case tracking-normal text-ink shadow-xl ${align === 'end' ? 'right-0' : 'left-0'}`}
      >
        {children}
      </span>
    </span>
  );
}
