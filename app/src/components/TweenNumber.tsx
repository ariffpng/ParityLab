import { useTween } from '../hooks/useTween';

type Props = { value: number; format: (n: number) => string; className?: string; testId?: string };

/** A big number that counts to its new value; the settled text is exactly `format(value)`. */
export function TweenNumber({ value, format, className, testId }: Props) {
  const shown = useTween(value);
  return (
    <span className={className} data-testid={testId} data-value={format(value)}>
      {format(shown)}
    </span>
  );
}
