import type { MyrDirection } from '../lib/finance';
import { directionWords } from '../lib/interpretation';
import { ArrowDownIcon, ArrowUpIcon, EqualIcon } from './Icons';

type Props = {
  direction: MyrDirection;
  size?: 'md' | 'lg';
  /** Optional change shown after the words, e.g. "+0.4878%". */ value?: string;
};

const WIDEST = directionWords('appreciates');

const STYLE: Record<MyrDirection, { cls: string; detail: string }> = {
  appreciates: { cls: 'bg-up-soft text-up-ink border-up/50', detail: 'MYR/USD falls' },
  depreciates: { cls: 'bg-down-soft text-down-ink border-down/50', detail: 'MYR/USD rises' },
  unchanged: { cls: 'bg-flat-soft text-ink-2 border-flat/50', detail: 'MYR/USD unchanged' },
};

/**
 * Direction in plain words AND an arrow (the arrow follows the MYR/USD quote); never colour alone.
 * An invisible copy of the widest text keeps one width for all three states.
 */
export function DirectionBadge({ direction, size = 'md', value }: Props) {
  const s = STYLE[direction];
  const Icon = direction === 'appreciates' ? ArrowDownIcon : direction === 'depreciates' ? ArrowUpIcon : EqualIcon;
  const big = size === 'lg';
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border font-bold ${s.cls} ${big ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'}`}
      data-direction={direction}
    >
      <Icon className={`shrink-0 ${big ? 'h-5 w-5' : 'h-4 w-4'}`} />
      <span className="inline-grid">
        <span className="col-start-1 row-start-1">
          {directionWords(direction)}
          {value && <span className="tabular"> {value}</span>}
          <span className="sr-only"> ({s.detail})</span>
        </span>
        <span className="invisible col-start-1 row-start-1 tabular" aria-hidden="true">
          {WIDEST}
          {value && ' +88.8888%'}
        </span>
      </span>
    </span>
  );
}
