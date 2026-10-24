import { useMemo } from 'react';
import katex from 'katex';

type Props = { tex: string; display?: boolean; className?: string };

/** Renders KaTeX to HTML + MathML (MathML keeps formulas readable by screen readers). */
export function Tex({ tex, display = false, className }: Props) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' }),
    [tex, display],
  );
  if (display) return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
