import type { MyrDirection } from '../lib/finance';
import { formatPctChange, formatSpot } from '../lib/format';
import { directionWords } from '../lib/interpretation';
import { rmSide, seesawAngle } from '../lib/visuals';
import { SrTable } from './SrTable';

type Props = {
  spot: number;
  ppp: number;
  quoteChangePct: number;
  myrValueChangePct: number;
  direction: MyrDirection;
  /** Show the "Ringgit stronger" word label (Home). The Simulator shows a badge beside it instead. */
  showLabel?: boolean;
  /** Settle from level into the tilt once on mount (Home hero). */
  settle?: boolean;
  className?: string;
};

const PIVOT = { x: 160, y: 104 };

/**
 * Currency see-saw: an RM weight and a US$ weight on a beam. The tilt is
 * proportional to the PPP quote change (5° per 1%, capped at ±15°). The RM side
 * rises when the ringgit is stronger, drops when it is weaker, and the beam is
 * level when nothing changes.
 */
export function SeeSaw({
  spot,
  ppp,
  quoteChangePct,
  myrValueChangePct,
  direction,
  showLabel = false,
  settle = false,
  className,
}: Props) {
  const angle = seesawAngle(quoteChangePct);
  const side = rmSide(direction);
  const words = directionWords(direction);
  const summary =
    side === 'level'
      ? `Currency see-saw: level. No change; US$1 stays at RM ${formatSpot(ppp)}.`
      : `Currency see-saw: the RM side ${side === 'up' ? 'rises' : 'drops'}. ${words}: US$1 goes from RM ${formatSpot(spot)} to RM ${formatSpot(ppp)} in the model.`;
  const weightOffset = (dx: number) => ({ x: PIVOT.x + dx, y: PIVOT.y - 34 });
  const rm = weightOffset(-112);
  const usd = weightOffset(112);

  return (
    <div className={className} data-testid="seesaw" data-rm-side={side} data-angle={angle.toFixed(4)}>
      <svg viewBox={`0 0 320 ${showLabel ? 200 : 176}`} role="img" aria-label={summary} className="block h-auto w-full">
        {/* Fulcrum */}
        <path d={`M ${PIVOT.x} ${PIVOT.y + 6} L ${PIVOT.x - 30} 160 L ${PIVOT.x + 30} 160 Z`} fill="var(--color-ink)" />
        <rect x="70" y="160" width="180" height="6" rx="3" fill="var(--color-line)" />
        {/* Beam with the two weights (weights stay upright) */}
        <g
          className={`seesaw-beam ${settle ? 'seesaw-settle' : ''}`}
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}
        >
          <rect x="22" y={PIVOT.y - 6} width="276" height="12" rx="6" fill="var(--color-ink-2)" />
          <line x1={rm.x} x2={rm.x} y1={rm.y + 26} y2={PIVOT.y - 6} stroke="var(--color-ink-2)" strokeWidth="4" />
          <line x1={usd.x} x2={usd.x} y1={usd.y + 26} y2={PIVOT.y - 6} stroke="var(--color-ink-2)" strokeWidth="4" />
          <g style={{ transform: `rotate(${-angle}deg)`, transformOrigin: `${rm.x}px ${rm.y}px` }} className="seesaw-beam">
            <circle cx={rm.x} cy={rm.y} r="28" fill="var(--color-my)" stroke="var(--color-surface)" strokeWidth="3" />
            <text x={rm.x} y={rm.y} dy="0.35em" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--color-ink)">
              RM
            </text>
          </g>
          <g style={{ transform: `rotate(${-angle}deg)`, transformOrigin: `${usd.x}px ${usd.y}px` }} className="seesaw-beam">
            <circle cx={usd.x} cy={usd.y} r="28" fill="var(--color-us)" stroke="var(--color-surface)" strokeWidth="3" />
            <text x={usd.x} y={usd.y} dy="0.35em" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--color-surface)">
              US$
            </text>
          </g>
        </g>
        <circle cx={PIVOT.x} cy={PIVOT.y} r="5" fill="var(--color-accent)" stroke="var(--color-ink)" strokeWidth="2" />
        {showLabel && (
          <text x={PIVOT.x} y="192" textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--color-ink)">
            {words}
          </text>
        )}
      </svg>
      <SrTable
        caption="Currency see-saw data (model scenario)"
        rows={[
          ["Today's rate", `${formatSpot(spot)} MYR/USD`],
          ['PPP future rate', `${formatSpot(ppp)} MYR/USD`],
          ['MYR/USD change', formatPctChange(quoteChangePct)],
          ['Ringgit value change', formatPctChange(myrValueChangePct)],
          ['Direction', words],
        ]}
      />
    </div>
  );
}
