import { useEffect, useRef, useState } from 'react';

/** Tracks an element's content width so SVG charts render text at real pixel size. */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth((prev) => (Math.abs(w - prev) > 0.5 ? Math.floor(w) : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** "Nice" tick values covering [lo, hi] with roughly `target` ticks. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

/** Decimal places needed to print ticks of a given step cleanly. */
export function tickDecimals(ticks: number[]): number {
  if (ticks.length < 2) return 2;
  const step = Math.abs(ticks[1] - ticks[0]);
  return Math.max(0, Math.min(4, -Math.floor(Math.log10(step) + 1e-9)));
}
