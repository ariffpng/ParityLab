import { useSettled } from '../hooks/useSettled';

/**
 * A visually hidden polite live region. Results are announced once the learner stops
 * changing inputs, so screen-reader users hear the new value without hunting for it.
 * A `hidden` message (invalid inputs) replaces the text at once: the region must never
 * keep numbers from inputs that are no longer valid.
 */
export function ResultAnnouncer({ message, hidden = false }: { message: string; hidden?: boolean }) {
  const settled = useSettled(message);
  return (
    <p className="sr-only" role="status" aria-live="polite" data-testid="result-announcer">
      {hidden ? message : settled}
    </p>
  );
}
