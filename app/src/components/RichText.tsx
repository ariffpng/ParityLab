import { Fragment } from 'react';

/** Renders interpretation text, turning **bold** markers into <strong>. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, k) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={k}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={k}>{part}</Fragment>
        ),
      )}
    </>
  );
}
