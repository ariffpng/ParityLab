import type { MyrDirection } from '../lib/finance';
import { directionWords } from '../lib/interpretation';
import { ArrowDownIcon, ArrowUpIcon, EqualIcon } from './Icons';

type Props = {
  direction: MyrDirection;
  size?: 'md' | 'lg';
};

const WIDEST = directionWords('appreciates');

const STYLE: Record<MyrDirection, { cls: string; verb: string }> = {
  appreciates: { cls: 'bg-up-soft text-up-ink border-up/50', verb: 'falls' },
  depreciates: { cls: 'bg-down-soft text-down-ink border-down/50', verb: 'rises' },
  unchanged: { cls: 'bg-flat-soft text-ink-2 border-flat/50', verb: 'unchanged' },
};

/**
 * Direction in plain words AND an arrow, never colour alone. The arrow sits inside a
 * "MYR/USD" segment so it always reads as the quote's move (↓ = ringgit stronger), never
 * as the ringgit falling. An invisible copy of the widest words keeps one width for all
 * three states.
 */
export function DirectionBadge({ direction, size = 'md' }: Props) {
  const s = STYLE[direction];
  const Icon = direction === 'appreciates' ? ArrowDownIcon : direction === 'depreciates' ? ArrowUpIcon : EqualIcon;
  const big = size === 'lg';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-bold ${s.cls} ${big ? 'gap-3 py-2 pl-3 pr-4 text-base md:text-lg' : 'gap-2 py-1 pl-2 pr-3 text-sm'}`}
      data-direction={direction}
    >
      <span className={`inline-flex items-center gap-1 border-r border-current/30 font-semibold ${big ? 'pr-3 text-sm' : 'pr-2 text-xs'}`}>
        MYR/USD
        <Icon className={`shrink-0 ${big ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <span className="sr-only"> {s.verb}:</span>
      </span>
      <span className="inline-grid">
        <span className="col-start-1 row-start-1">{directionWords(direction)}</span>
        <span className="invisible col-start-1 row-start-1" aria-hidden="true">
          {WIDEST}
        </span>
      </span>
    </span>
  );
}
