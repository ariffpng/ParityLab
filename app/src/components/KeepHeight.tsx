import { useLayoutEffect, useRef, type ReactNode } from 'react';

/**
 * Layout-stability helper: remembers its height while `hold` is false and keeps at
 * least that height while `hold` is true, so swapping the content for a short
 * message (for example when inputs become invalid) never pulls the page up.
 */
export function KeepHeight({ hold, children, className }: { hold: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const height = useRef(0);
  useLayoutEffect(() => {
    if (!hold && ref.current) height.current = ref.current.offsetHeight;
  });
  return (
    <div ref={ref} className={className} style={hold && height.current ? { minHeight: height.current } : undefined}>
      {children}
    </div>
  );
}
