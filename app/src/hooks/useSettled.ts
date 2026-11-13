import { useEffect, useState } from 'react';

/**
 * Returns `value` once it has stopped changing for `delay` ms. Used for the polite
 * screen-reader announcement of results, so dragging a slider announces only where it
 * comes to rest instead of every step on the way.
 */
export function useSettled<T>(value: T, delay = 700): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
