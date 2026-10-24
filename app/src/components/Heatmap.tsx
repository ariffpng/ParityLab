import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { formatInputPct, formatPctChange, formatSpot } from '../lib/format';
import { directionWords } from '../lib/interpretation';
import { HEAT_MAX, HEAT_MIN, HEAT_STEP, heatIntensity, heatmapCells, type HeatCell } from '../lib/visuals';
import { ChevronIcon } from './Icons';
import { useElementWidth } from './useElementWidth';

type Props = {
  spot: number;
  /** Scenario B's current inflation pair (percent), marked on the grid. */
  current: { myPct: number; usPct: number };
  /** Load a cell into Scenario B. */
  onPick: (myPct: number, usPct: number) => void;
};

const N = Math.round((HEAT_MAX - HEAT_MIN) / HEAT_STEP) + 1;

/** Diverging fill: green for a stronger ringgit, red for weaker, neutral at no change. */
function cellFill(c: HeatCell): string {
  const t = heatIntensity(c.quoteChangePct);
  if (c.direction === 'unchanged' || t === 0) return 'var(--color-flat-soft)';
  const share = Math.round(18 + Math.abs(t) * 72);
  return `color-mix(in oklab, ${t < 0 ? 'var(--color-up)' : 'var(--color-down)'} ${share}%, var(--color-surface))`;
}

function describe(c: HeatCell): string {
  return `Malaysia ${formatInputPct(c.myPct)}, US ${formatInputPct(c.usPct)}: MYR/USD ${formatPctChange(c.quoteChangePct)} (${formatSpot(c.ppp)} MYR/USD), ${directionWords(c.direction).toLowerCase()}`;
}

const clampIndex = (k: number) => Math.max(0, Math.min(N - 1, k));
const indexOf = (pct: number) => clampIndex(Math.round((pct - HEAT_MIN) / HEAT_STEP));

/**
 * π_MY × π_US heatmap of the PPP quote change. Hover or arrow keys read a cell;
 * click or Enter loads it into Scenario B. Region labels and the "no change"
 * diagonal carry the meaning in words as well as colour.
 */
export function Heatmap({ spot, current, onPick }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const cells = useMemo(() => heatmapCells(spot), [spot]);
  const [cursor, setCursor] = useState<{ k: number; j: number }>(() => ({
    k: indexOf(current.myPct),
    j: indexOf(current.usPct),
  }));
  const [active, setActive] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const liveId = useId();

  const m = { top: 8, right: 8, bottom: 48, left: 56 };
  const side = Math.max(200, Math.min(520, width - m.left - m.right));
  const cell = side / N;
  const height = m.top + side + m.bottom;
  const px = (pct: number) => m.left + ((pct - HEAT_MIN) / HEAT_STEP + 0.5) * cell;
  const py = (pct: number) => m.top + side - ((pct - HEAT_MIN) / HEAT_STEP + 0.5) * cell;
  const at = (k: number, j: number) => cells[j * N + k];
  const focus = at(cursor.k, cursor.j);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    if (e.key in moves) {
      e.preventDefault();
      const [dk, dj] = moves[e.key];
      setActive(true);
      setCursor((c) => ({ k: clampIndex(c.k + dk), j: clampIndex(c.j + dj) }));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(focus.myPct, focus.usPct);
    }
  };

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-start gap-8">
        <div ref={ref} className="w-full min-w-0 max-w-[36rem]">
          <div
            role="group"
            tabIndex={0}
            aria-label="Sensitivity heatmap: Malaysia inflation across, US inflation up. Arrow keys move, Enter loads the cell into Scenario B."
            aria-describedby={liveId}
            onKeyDown={onKey}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className="inline-block rounded-lg"
            data-testid="heatmap"
          >
            <svg
              width={m.left + side + m.right}
              height={height}
              className="block max-w-full"
              aria-hidden="true"
              onMouseLeave={() => setActive(false)}
            >
              {cells.map((c, idx) => {
                const k = idx % N;
                const j = Math.floor(idx / N);
                return (
                  <rect
                    key={idx}
                    x={m.left + k * cell}
                    y={m.top + side - (j + 1) * cell}
                    width={cell + 0.5}
                    height={cell + 0.5}
                    fill={cellFill(c)}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setCursor({ k, j });
                      setActive(true);
                    }}
                    onClick={() => onPick(c.myPct, c.usPct)}
                  />
                );
              })}
              <line
                x1={m.left}
                y1={m.top + side}
                x2={m.left + side}
                y2={m.top}
                stroke="var(--color-ink)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text
                x={m.left + side * 0.62}
                y={m.top + side * 0.38 - 8}
                fontSize={12}
                fontWeight={700}
                fill="var(--color-ink)"
                transform={`rotate(-45 ${m.left + side * 0.62} ${m.top + side * 0.38 - 8})`}
                textAnchor="middle"
                paintOrder="stroke"
                stroke="var(--color-surface)"
                strokeWidth={4}
              >
                no change
              </text>
              <text
                x={m.left + 10}
                y={m.top + 22}
                fontSize={14}
                fontWeight={800}
                fill="var(--color-ink)"
                paintOrder="stroke"
                stroke="var(--color-surface)"
                strokeWidth={4}
              >
                ↓ Ringgit stronger
              </text>
              <text
                x={m.left + side - 10}
                y={m.top + side - 12}
                textAnchor="end"
                fontSize={14}
                fontWeight={800}
                fill="var(--color-ink)"
                paintOrder="stroke"
                stroke="var(--color-surface)"
                strokeWidth={4}
              >
                ↑ Ringgit weaker
              </text>
              {/* Scenario B marker */}
              <circle
                cx={px(Math.max(HEAT_MIN, Math.min(HEAT_MAX, current.myPct)))}
                cy={py(Math.max(HEAT_MIN, Math.min(HEAT_MAX, current.usPct)))}
                r={Math.max(6, cell * 0.45)}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={4}
              />
              <circle
                cx={px(Math.max(HEAT_MIN, Math.min(HEAT_MAX, current.myPct)))}
                cy={py(Math.max(HEAT_MIN, Math.min(HEAT_MAX, current.usPct)))}
                r={Math.max(6, cell * 0.45) + 3}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={1.5}
              />
              {active && (
                <rect
                  x={m.left + cursor.k * cell}
                  y={m.top + side - (cursor.j + 1) * cell}
                  width={cell}
                  height={cell}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth={2.5}
                  pointerEvents="none"
                />
              )}
              {[-5, 0, 5, 10, 15].map((t) => (
                <g key={t}>
                  <text x={px(t)} y={m.top + side + 16} textAnchor="middle" fontSize={12} fill="var(--color-ink-3)">
                    {String(t).replace('-', '−')}%
                  </text>
                  <text x={m.left - 8} y={py(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--color-ink-3)">
                    {String(t).replace('-', '−')}%
                  </text>
                </g>
              ))}
              <text
                x={m.left + side / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="var(--color-ink)"
              >
                Malaysia inflation (π_MY) →
              </text>
              <text
                transform={`translate(14 ${m.top + side / 2}) rotate(-90)`}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="var(--color-ink)"
              >
                US inflation (π_US) →
              </text>
            </svg>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <p id={liveId} aria-live="polite" className="h-32 overflow-hidden rounded-xl bg-surface-2 p-4 text-sm text-ink">
            {active
              ? describe(focus)
              : 'Hover or use the arrow keys to read a cell. Click or press Enter to load it into Scenario B.'}
          </p>
          <div>
            <p className="text-sm font-bold text-ink">PPP change in MYR/USD</p>
            <div
              className="mt-2 h-3 rounded-full"
              style={{
                background: 'linear-gradient(to right, var(--color-up), var(--color-flat-soft) 50%, var(--color-down))',
              }}
              aria-hidden="true"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-2">
              <span>↓ Ringgit stronger</span>
              <span>No change</span>
              <span>Ringgit weaker ↑</span>
            </div>
            <p className="mt-2 text-xs text-ink-3">Colour saturates beyond ±12%. The ringed cell is Scenario B.</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable((s) => !s)}
      >
        <ChevronIcon className={`h-4 w-4 transition-transform ${showTable ? 'rotate-180' : ''}`} />
        Show heatmap values as a table
      </button>
      <div id={tableId} hidden={!showTable} className="mt-2 overflow-x-auto">
        {showTable && (
          <table className="data-table min-w-[32rem]">
            <caption className="sr-only">PPP change in MYR/USD (%), every 5 pp</caption>
            <thead>
              <tr>
                <th scope="col">π_US \ π_MY</th>
                {[-5, 0, 5, 10, 15].map((t) => (
                  <th key={t} scope="col" className="num">
                    {formatInputPct(t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[15, 10, 5, 0, -5].map((us) => (
                <tr key={us}>
                  <th scope="row">{formatInputPct(us)}</th>
                  {[-5, 0, 5, 10, 15].map((my) => (
                    <td key={my} className="num">
                      {formatPctChange(at(indexOf(my), indexOf(us)).quoteChangePct)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </figure>
  );
}
