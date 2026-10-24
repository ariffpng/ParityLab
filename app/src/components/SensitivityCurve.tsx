import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { myrDirection, pppSpot } from '../lib/finance';
import { formatInputPct, formatSpot } from '../lib/format';
import { directionWords } from '../lib/interpretation';
import { CURVE_MAX, CURVE_MIN, curvePoints, snapCurveValue } from '../lib/visuals';
import { ChevronIcon } from './Icons';
import { niceTicks, tickDecimals, useElementWidth } from './useElementWidth';

type Props = {
  /** Scenario B's Malaysian expected inflation (held fixed), in percent. */
  myInflationPct: number;
  spot: number;
  /** Scenario B's US expected inflation (the draggable point), in percent. */
  usInflationPct: number;
  /** Called with a new US inflation value (0.1 pp grid) while dragging or using the keys. */
  onChange: (usInflationPct: number) => void;
};

/**
 * PPP future rate as US expected inflation sweeps −5% to 15% (π_MY and S₀ fixed).
 * The current point can be dragged along the curve, or moved with the arrow
 * keys, and edits Scenario B live. Every point comes from the engine.
 */
export function SensitivityCurve({ myInflationPct, spot, usInflationPct, onChange }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [showTable, setShowTable] = useState(false);
  const dragging = useRef(false);
  const tableId = useId();
  const points = useMemo(() => curvePoints(spot, myInflationPct), [spot, myInflationPct]);

  const narrow = width < 520;
  const height = 340;
  const m = { top: 16, right: 16, bottom: 56, left: narrow ? 60 : 72 };
  const plotW = Math.max(160, width - m.left - m.right);
  const plotH = height - m.top - m.bottom;
  const ys = points.map((p) => p.y);
  const pad = (Math.max(...ys) - Math.min(...ys)) * 0.06;
  const lo = Math.min(...ys, spot) - pad;
  const hi = Math.max(...ys, spot) + pad;
  const yTicks = niceTicks(lo, hi, 5);
  const dp = tickDecimals(yTicks);
  const sx = (v: number) => m.left + ((v - CURVE_MIN) / (CURVE_MAX - CURVE_MIN)) * plotW;
  const sy = (v: number) => m.top + ((hi - v) / (hi - lo)) * plotH;
  const path = points.map((p, k) => `${k === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ');

  const shown = Math.min(CURVE_MAX, Math.max(CURVE_MIN, usInflationPct));
  const value = pppSpot(spot, myInflationPct / 100, shown / 100);
  const words = directionWords(myrDirection(myInflationPct / 100, shown / 100));
  const valueText = `US inflation ${formatInputPct(shown)}: PPP future rate ${formatSpot(value)} MYR/USD, ${words.toLowerCase()}`;
  const s0y = sy(spot);
  const px = sx(shown);
  const py = sy(value);

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = CURVE_MIN + ((e.clientX - rect.left - m.left) / plotW) * (CURVE_MAX - CURVE_MIN);
    onChange(snapCurveValue(v));
  };
  const onKey = (e: KeyboardEvent<SVGCircleElement>) => {
    const steps: Record<string, number> = {
      ArrowRight: 0.1,
      ArrowUp: 0.1,
      ArrowLeft: -0.1,
      ArrowDown: -0.1,
      PageUp: 1,
      PageDown: -1,
    };
    if (e.key in steps) {
      e.preventDefault();
      onChange(snapCurveValue(shown + steps[e.key]));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      onChange(e.key === 'Home' ? CURVE_MIN : CURVE_MAX);
    }
  };

  return (
    <figure className="m-0">
      {/* One fixed-height line, so the chart (and its draggable point) never moves as the values change. */}
      <p className="mb-2 flex h-8 items-baseline gap-x-4 overflow-hidden whitespace-nowrap text-ink" aria-hidden="true">
        <span className="text-sm text-ink-2">π_US = {formatInputPct(shown)}</span>
        <span className="text-lg font-bold tabular">{formatSpot(value)} MYR/USD</span>
        <span className="text-sm font-semibold text-ink-2">{words}</span>
      </p>
      <div ref={ref} className="w-full">
        <svg
          width={width}
          height={height}
          className="block max-w-full touch-pan-y select-none"
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            fromPointer(e);
          }}
          onPointerMove={(e) => dragging.current && fromPointer(e)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* Shaded regions: above today's rate = ringgit weaker, below = stronger */}
          <rect x={m.left} y={m.top} width={plotW} height={Math.max(0, s0y - m.top)} fill="var(--color-down-soft)" />
          <rect x={m.left} y={s0y} width={plotW} height={Math.max(0, m.top + plotH - s0y)} fill="var(--color-up-soft)" />
          {/* The curve always falls left to right, so the top-right and bottom-left corners stay clear. */}
          <text
            x={m.left + plotW - 8}
            y={m.top + 20}
            textAnchor="end"
            fontSize={13}
            fontWeight={700}
            fill="var(--color-down-ink)"
          >
            ↑ Ringgit weaker
          </text>
          <text x={m.left + 8} y={m.top + plotH - 10} fontSize={13} fontWeight={700} fill="var(--color-up-ink)">
            ↓ Ringgit stronger
          </text>

          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + plotW} y1={sy(t)} y2={sy(t)} stroke="var(--color-line)" strokeWidth={1} />
              <text
                x={m.left - 8}
                y={sy(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={12}
                fill="var(--color-ink-3)"
                className="tabular"
              >
                {t.toFixed(dp)}
              </text>
            </g>
          ))}
          {[-5, 0, 5, 10, 15].map((t) => (
            <text
              key={t}
              x={sx(t)}
              y={m.top + plotH + 18}
              textAnchor="middle"
              fontSize={12}
              fill="var(--color-ink-3)"
              className="tabular"
            >
              {String(t).replace('-', '−')}%
            </text>
          ))}
          <line
            x1={m.left}
            x2={m.left + plotW}
            y1={m.top + plotH}
            y2={m.top + plotH}
            stroke="var(--color-ink)"
            strokeWidth={1.5}
          />
          <text x={m.left + plotW / 2} y={height - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--color-ink)">
            US inflation (π_US)
          </text>
          <text
            transform={`translate(16 ${m.top + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="var(--color-ink)"
          >
            MYR per USD — lower = MYR stronger
          </text>

          <line
            x1={m.left}
            x2={m.left + plotW}
            y1={s0y}
            y2={s0y}
            stroke="var(--color-ink-2)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text x={m.left + 8} y={s0y - 8} fontSize={12} fill="var(--color-ink-2)">
            today {formatSpot(spot)} MYR/USD
          </text>

          <path d={path} fill="none" stroke="var(--color-us)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          <line x1={px} x2={px} y1={m.top} y2={m.top + plotH} stroke="var(--color-ink-2)" strokeWidth={1} strokeOpacity={0.5} />

          <circle
            cx={px}
            cy={py}
            r={11}
            fill="var(--color-accent)"
            stroke="var(--color-ink)"
            strokeWidth={3}
            role="slider"
            tabIndex={0}
            aria-label="US inflation on the curve"
            aria-valuemin={CURVE_MIN}
            aria-valuemax={CURVE_MAX}
            aria-valuenow={shown}
            aria-valuetext={valueText}
            onKeyDown={onKey}
            className="cursor-grab"
          />
        </svg>
      </div>
      <figcaption className="mt-2 text-sm text-ink-2">
        Malaysia&apos;s inflation and today&apos;s rate stay at Scenario B&apos;s values. Drag the point or use the arrow keys.
      </figcaption>
      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable((s) => !s)}
      >
        <ChevronIcon className={`h-4 w-4 transition-transform ${showTable ? 'rotate-180' : ''}`} />
        Show values as a table
      </button>
      <div id={tableId} hidden={!showTable} className="mt-2 overflow-x-auto">
        {showTable && (
          <table className="data-table max-w-md">
            <thead>
              <tr>
                <th scope="col">π_US</th>
                <th scope="col" className="num">
                  PPP future rate (MYR/USD)
                </th>
              </tr>
            </thead>
            <tbody>
              {points
                .filter((_, k) => k % 25 === 0)
                .map((p) => (
                  <tr key={p.x}>
                    <td>{formatInputPct(p.x)}</td>
                    <td className="num">{formatSpot(p.y)} MYR/USD</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </figure>
  );
}
