import { useEffect, useRef, useState } from 'react';

/** True when the browser can animate and the user has not asked for reduced motion. */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  if (typeof window.requestAnimationFrame !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Number tween: moves smoothly (ease-out cubic) from the previous value to
 * `target`. Under reduced motion, or where the browser cannot animate (tests),
 * it returns `target` immediately. The settled value is always exactly `target`,
 * so formatted text ends identical to format.ts output.
 */
export function useTween(target: number, duration = 300): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const animate = motionAllowed();

  useEffect(() => {
    if (!animate || !Number.isFinite(target) || !Number.isFinite(shownRef.current)) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const from = shownRef.current;
    if (from === target) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const value = t >= 1 ? target : from + (target - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, animate]);

  return animate ? shown : target;
}
