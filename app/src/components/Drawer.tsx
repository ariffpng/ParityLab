import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CrossIcon } from './Icons';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * "Show the math" slide-over: a modal dialog on the right (bottom sheet on
 * phones). Esc, the close button and the backdrop close it; Tab stays inside;
 * focus returns to whatever opened it.
 */
export function Drawer({ open, title, onClose, children, footer }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="no-print fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} data-testid="drawer-backdrop" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="drawer-panel relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl md:max-h-none md:w-[36rem] md:rounded-none md:rounded-l-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <p className="eyebrow">Show the math</p>
            <h2 id={titleId} className="text-xl font-bold text-ink">
              {title}
            </h2>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close" data-autofocus>
            <CrossIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
