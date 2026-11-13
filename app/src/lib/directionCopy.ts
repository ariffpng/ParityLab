/**
 * Display copy that ties every direction arrow to the MYR/USD quote and gives each
 * percentage its own words, so a learner never has to reconcile "+0.4878%" with
 * "−0.4854%" or read a bare ↓ as "the ringgit fell". Pure; no React.
 */
import type { MyrDirection, Results } from './finance';
import { fixed, formatSpot } from './format';
import { directionWords } from './interpretation';

/** The arrow follows the MYR/USD quote (CLAUDE.md rule 7): ↓ = ringgit stronger. */
export function quoteArrow(direction: MyrDirection): '↓' | '↑' | '=' {
  return direction === 'appreciates' ? '↓' : direction === 'depreciates' ? '↑' : '=';
}

/** "MYR/USD ↓, ringgit stronger": the arrow always names the number it describes. */
export function directionWithQuote(direction: MyrDirection): string {
  return `MYR/USD ${quoteArrow(direction)}, ${directionWords(direction).toLowerCase()}`;
}

/** Unsigned 4-dp magnitude, e.g. "0.4878%". */
function magnitude(pct: number): string {
  return `${fixed(Math.abs(pct), 4)}%`;
}

/** What the ringgit's value change means in plain words: "RM 1 buys 0.4878% more US dollars". */
export function ringgitValueSentence(r: Pick<Results, 'myrDirection' | 'myrValueChangePct'>): string {
  switch (r.myrDirection) {
    case 'appreciates':
      return `RM 1 buys ${magnitude(r.myrValueChangePct)} more US dollars`;
    case 'depreciates':
      return `RM 1 buys ${magnitude(r.myrValueChangePct)} fewer US dollars`;
    case 'unchanged':
      return 'RM 1 buys the same US dollars';
  }
}

/** What the quote does in plain words: "MYR/USD falls 0.4854%". */
export function quoteMoveSentence(r: Pick<Results, 'myrDirection' | 'quoteChangePct'>): string {
  switch (r.myrDirection) {
    case 'appreciates':
      return `MYR/USD falls ${magnitude(r.quoteChangePct)}`;
    case 'depreciates':
      return `MYR/USD rises ${magnitude(r.quoteChangePct)}`;
    case 'unchanged':
      return 'MYR/USD unchanged';
  }
}

/** The polite screen-reader announcement after the learner changes an assumption. */
export function resultAnnouncement(
  r: Pick<Results, 'pppSpot' | 'myrDirection' | 'myrValueChangePct' | 'quoteChangePct'>,
  prefix = '',
): string {
  const lead = prefix ? `${prefix}: ` : '';
  return (
    `${lead}PPP future rate ${formatSpot(r.pppSpot)} MYR/USD. ` +
    `${directionWords(r.myrDirection)}: ${quoteMoveSentence(r)}, ${ringgitValueSentence(r)}.`
  );
}

/** Direction of B relative to A: B's PPP rate lower than A's means the ringgit is stronger in B. */
export function relativeDirection(aPpp: number, bPpp: number): MyrDirection {
  const tolerance = 1e-10 * Math.max(1, Math.abs(aPpp));
  if (bPpp < aPpp - tolerance) return 'appreciates';
  if (bPpp > aPpp + tolerance) return 'depreciates';
  return 'unchanged';
}

/** The B − A cell of the direction row: "MYR/USD ↓, stronger in B". */
export function relativeDirectionText(direction: MyrDirection): string {
  const words = direction === 'appreciates' ? 'stronger in B' : direction === 'depreciates' ? 'weaker in B' : 'same in both';
  return `MYR/USD ${quoteArrow(direction)}, ${words}`;
}

/** Compare's one-sentence answer, shown in the page band: which way B moves the ringgit relative to A. */
export function compareConclusion(aPpp: number, bPpp: number): string {
  const a = formatSpot(aPpp);
  const b = formatSpot(bPpp);
  switch (relativeDirection(aPpp, bPpp)) {
    case 'appreciates':
      return `In Scenario B the ringgit ends stronger than in A: ${b} vs ${a} MYR/USD in one year.`;
    case 'depreciates':
      return `In Scenario B the ringgit ends weaker than in A: ${b} vs ${a} MYR/USD in one year.`;
    case 'unchanged':
      return `Scenarios A and B give the same PPP future rate: ${a} MYR/USD in one year.`;
  }
}
