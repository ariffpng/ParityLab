import { useId, type CSSProperties, type ReactNode } from 'react';
import { FIELD_SPECS, parseNumber, type FieldKey } from '../lib/validation';
import { AlertIcon } from './Icons';

type Dot = 'my' | 'us' | 'none';

type RateProps = {
  /** Wrapper id (used by the guided lesson to highlight the field). */
  id: string;
  field: FieldKey;
  label: string;
  value: string;
  error?: string;
  onChange: (raw: string) => void;
  dot?: Dot;
  dark?: boolean;
  /** Show a slider under the number field (Simulator); the compact Compare editor omits it. */
  slider?: boolean;
  highlighted?: boolean;
};

const DOT_CLASS: Record<Exclude<Dot, 'none'>, { light: string; dark: string }> = {
  my: { light: 'bg-my', dark: 'bg-my-on-dark' },
  us: { light: 'bg-us', dark: 'bg-us-on-dark' },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * A percentage assumption: a compact number field (the source of truth, any
 * precision) with an optional slider that enforces the range silently.
 */
export function RateField({
  id,
  field,
  label,
  value,
  error,
  onChange,
  dot = 'none',
  dark = false,
  slider = true,
  highlighted,
}: RateProps) {
  const spec = FIELD_SPECS[field];
  const inputId = `${id}-input`;
  const errorId = `${id}-error`;
  const parsed = parseNumber(value);
  const sliderValue = clamp(parsed.ok ? parsed.value : 0, spec.min, spec.max);
  const pct = ((sliderValue - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <div id={id} className={`rounded-xl ${highlighted ? 'highlight-ring' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={inputId}
          className={`flex items-center gap-2 text-base font-semibold ${dark ? 'text-on-panel' : 'text-ink'}`}
        >
          {dot !== 'none' && (
            <span className={`h-3 w-3 shrink-0 rounded-full ${DOT_CLASS[dot][dark ? 'dark' : 'light']}`} aria-hidden="true" />
          )}
          {label}
        </label>
        <span className="flex shrink-0 items-center gap-1">
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            className={`field w-24 ${dark ? 'field-dark' : ''}`}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className={`w-4 text-lg font-semibold ${dark ? 'text-on-panel-2' : 'text-ink-2'}`} aria-hidden="true">
            %
          </span>
        </span>
      </div>
      {slider && (
        <input
          type="range"
          aria-label={`${label} slider`}
          aria-valuetext={`${sliderValue}%`}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={sliderValue}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1 ${dark ? 'range-dark' : ''}`}
          style={{ '--pct': `${pct}%` } as CSSProperties}
        />
      )}
      <ErrorSlot id={errorId} dark={dark} message={error} />
    </div>
  );
}

type SpotProps = {
  id: string;
  value: string;
  error?: string;
  onChange: (raw: string) => void;
  dark?: boolean;
  highlighted?: boolean;
  /** Extra controls on the title row (tag, tooltip). */
  aside?: ReactNode;
};

/** Today's rate (spot): "US$1 = RM [4.4000]". The long label lives in the tooltip. */
export function SpotField({ id, value, error, onChange, dark = false, highlighted, aside }: SpotProps) {
  const titleId = useId();
  const prefixId = useId();
  const inputId = `${id}-input`;
  const errorId = `${id}-error`;
  return (
    <div id={id} className={`rounded-xl ${highlighted ? 'highlight-ring' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span id={titleId} className={`text-base font-semibold ${dark ? 'text-on-panel' : 'text-ink'}`}>
          Today&apos;s rate
        </span>
        {aside}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span id={prefixId} className={`text-lg font-semibold ${dark ? 'text-on-panel-2' : 'text-ink-2'}`}>
          US$1 = RM
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className={`field w-32 ${dark ? 'field-dark' : ''}`}
          value={value}
          aria-labelledby={`${titleId} ${prefixId}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <ErrorSlot id={errorId} dark={dark} message={error} />
    </div>
  );
}

/**
 * One line is always reserved under each field, so an error appearing never pushes the
 * next control down. A rare second line overflows into the gap below instead of moving it.
 */
function ErrorSlot({ id, message, dark }: { id: string; message?: string; dark: boolean }) {
  return (
    <div className="relative mt-1 h-5">
      {message && (
        <p
          id={id}
          role="alert"
          className={`absolute inset-x-0 top-0 z-10 flex items-start gap-2 text-sm leading-5 font-semibold ${dark ? 'text-error-on-dark' : 'text-error'}`}
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
