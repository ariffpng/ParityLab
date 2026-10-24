import type { MyrDirection } from '../lib/finance';
import { formatPctChange, formatSpot } from '../lib/format';
import { directionWords } from '../lib/interpretation';
import { paddedDomain } from '../lib/visuals';
import { useTween } from '../hooks/useTween';
import { SrTable } from './SrTable';
import { niceTicks, tickDecimals, useElementWidth } from './useElementWidth';

export type Lane = { key: string; label: string; spot: number; ppp: number; quoteChangePct: number; direction: MyrDirection };

const LANE_H = 88;
const TOP = 8;
const AXIS_H = 72;

/**
 * Before/after dumbbell: one lane per scenario, today's rate (hollow) → PPP
 * future rate (filled) on a shared MYR/USD axis. Positions tween smoothly.
 */
export function DumbbellChart({ lanes }: { lanes: Lane[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const narrow = width < 560;
  const m = { left: 16, right: 16 };
  const plotW = Math.max(160, width - m.left - m.right);
  const [lo, hi] = paddedDomain(
    lanes.flatMap((l) => [l.spot, l.ppp]),
    0.25,
    0.03,
  );
  const ticks = niceTicks(lo, hi, narrow ? 4 : 6);
  const dp = tickDecimals(ticks);
  const x = (v: number) => m.left + ((v - lo) / (hi - lo)) * plotW;
  const height = TOP + lanes.length * LANE_H + AXIS_H;
  const axisY = TOP + lanes.length * LANE_H;
  const summary =
    'MYR per USD, today versus the PPP future rate in one year. ' +
    lanes
      .map(
        (l) =>
          `${l.key} (${l.label}): ${formatSpot(l.spot)} to ${formatSpot(l.ppp)} MYR/USD, ${directionWords(l.direction).toLowerCase()}`,
      )
      .join('. ') +
    '. Lower means the ringgit is stronger.';

  return (
    <figure className="m-0">
      <div ref={ref} className="w-full">
        <svg width={width} height={height} role="img" aria-label={summary} className="block max-w-full">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={TOP} y2={axisY} stroke="var(--color-line)" strokeWidth={1} />
              <text x={x(t)} y={axisY + 18} textAnchor="middle" fontSize={12} fill="var(--color-ink-3)" className="tabular">
                {t.toFixed(dp)}
              </text>
            </g>
          ))}
          <line x1={m.left} x2={m.left + plotW} y1={axisY} y2={axisY} stroke="var(--color-ink)" strokeWidth={1.5} />
          <text x={m.left + plotW / 2} y={axisY + 40} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--color-ink)">
            MYR per USD — lower = MYR stronger
          </text>
          <text x={m.left} y={axisY + 62} fontSize={12} fill="var(--color-up-ink)" fontWeight={600}>
            ← Ringgit stronger
          </text>
          <text x={m.left + plotW} y={axisY + 62} textAnchor="end" fontSize={12} fill="var(--color-down-ink)" fontWeight={600}>
            Ringgit weaker →
          </text>
          {lanes.map((lane, k) => (
            <LaneRow key={lane.key} lane={lane} y={TOP + k * LANE_H} x={x} />
          ))}
        </svg>
      </div>
      <SrTable
        caption="Today's rate and PPP future rate by scenario (MYR/USD)"
        rows={lanes.flatMap((l) => [
          [`${l.key} · ${l.label}: today`, `${formatSpot(l.spot)} MYR/USD`],
          [
            `${l.key} · ${l.label}: PPP future rate`,
            `${formatSpot(l.ppp)} MYR/USD (${formatPctChange(l.quoteChangePct)}, ${directionWords(l.direction)})`,
          ],
        ])}
      />
    </figure>
  );
}

function LaneRow({ lane, y, x }: { lane: Lane; y: number; x: (v: number) => number }) {
  const spotX = x(useTween(lane.spot));
  const pppX = x(useTween(lane.ppp));
  const cy = y + 56;
  const same = Math.abs(pppX - spotX) < 2;
  const dir = pppX < spotX ? -1 : 1;
  const stroke =
    lane.direction === 'appreciates'
      ? 'var(--color-up)'
      : lane.direction === 'depreciates'
        ? 'var(--color-down)'
        : 'var(--color-flat)';
  // The arrowhead stops just before the filled dot so it stays visible.
  const tipX = pppX - dir * 12;
  const baseX = tipX - dir * 12;
  return (
    <g>
      <text x={16} y={y + 18} fontSize={14} fontWeight={700} fill="var(--color-ink)">
        {lane.key} · {lane.label}
        <tspan fontWeight={600} fill="var(--color-ink-2)">
          {'  '}
          {lane.direction === 'appreciates' ? '↓' : lane.direction === 'depreciates' ? '↑' : '='} {directionWords(lane.direction)}
        </tspan>
      </text>
      {!same && (
        <>
          {Math.abs(baseX - spotX) > 10 && (
            <line x1={spotX} x2={baseX} y1={cy} y2={cy} stroke={stroke} strokeWidth={6} strokeLinecap="round" />
          )}
          <path d={`M ${baseX} ${cy - 9} L ${tipX} ${cy} L ${baseX} ${cy + 9} Z`} fill={stroke} />
        </>
      )}
      <circle cx={spotX} cy={cy} r={9} fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth={3} />
      <circle cx={pppX} cy={cy} r={9} fill="var(--color-ink)" stroke="var(--color-accent)" strokeWidth={3} />
      <text x={spotX} y={cy - 16} textAnchor="middle" fontSize={12} fill="var(--color-ink-2)" className="tabular">
        today {formatSpot(lane.spot)}
      </text>
      <text x={pppX} y={cy + 26} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--color-ink)" className="tabular">
        {formatSpot(lane.ppp)} MYR/USD
      </text>
    </g>
  );
}
