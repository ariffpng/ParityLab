import { Fragment, type ReactNode } from 'react';

/** Symbol subscripts written as `π_MY`, `i_US`, `S_PPP` in content strings. */
const SUBSCRIPT = /([πirSF])_(MY|US|PPP)/g;

/** Typesets `π_MY` as π with a subscript, so prose never shows code-style underscores. */
function withSubscripts(text: string, keyBase: number): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(SUBSCRIPT)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <Fragment key={`${keyBase}-${at}`}>
        {m[1]}
        <sub>{m[2]}</sub>
      </Fragment>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Renders interpretation and topic text: **bold** markers become <strong>; π_MY gets a real subscript. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, k) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={k}>{withSubscripts(part.slice(2, -2), k)}</strong>
        ) : (
          <Fragment key={k}>{withSubscripts(part, k)}</Fragment>
        ),
      )}
    </>
  );
}
