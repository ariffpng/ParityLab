/**
 * Guided lesson (5 steps, ≤ 25 words of copy each). Numbers come from the
 * engine at runtime using the preset scenarios, so the text can never drift
 * from the calculations.
 */
import { calculate } from '../lib/finance';
import { formatPctChange, formatRate, formatSpot, formatSpotUnit } from '../lib/format';
import { PRESETS } from '../lib/scenarios';

export type LessonStep = {
  title: string;
  body: string;
  /** Element ids on the Simulator screen to highlight; the first is scrolled into view. */
  highlight: string[];
  /** The last step asks for a prediction before revealing the answer. */
  prediction?: boolean;
};

const A = calculate(PRESETS.A.inputs);
const B = calculate(PRESETS.B.inputs);

export const LESSON_STEPS: LessonStep[] = [
  {
    title: 'Read the quote first',
    body: `MYR/USD means ringgit per US dollar. Today US$1 = RM ${formatSpot(A.spot)}. A lower number means a stronger ringgit.`,
    highlight: ['sim-field-spot'],
  },
  {
    title: 'Nominal = real + inflation',
    body: `A 1.50% real rate plus expected inflation gives Fisher nominal rates: ${formatRate(A.nominalMYPct)} (Malaysia) and ${formatRate(A.nominalUSPct)} (US).`,
    highlight: ['card-fisher-my', 'card-fisher-us'],
  },
  {
    title: 'Inflation moves the rate',
    body: `US inflation is higher, so PPP lowers MYR/USD: ${formatSpot(A.spot)} → ${formatSpot(A.pppSpot)} (${formatPctChange(A.quoteChangePct)}). The ringgit strengthens in the model.`,
    highlight: ['card-ppp'],
  },
  {
    title: 'The forward matches here',
    body: `The theoretical forward is also ${formatSpotUnit(A.cipForward)}: the shared real rate cancels. A forward is a contract price, not a forecast.`,
    highlight: ['card-cip', 'flow-card'],
  },
  {
    title: 'Predict before you look',
    body: 'US inflation rises from 3.00% to 5.00%, everything else fixed. Will MYR/USD rise or fall?',
    // The first id is scrolled into view, so the revealed PPP value is on screen.
    highlight: ['card-ppp', 'sim-field-usInflation'],
    prediction: true,
  },
];

export const LESSON_REVEAL = {
  correct: 'fall' as const,
  explanation: `It falls to ${formatSpotUnit(B.pppSpot)} (${formatPctChange(B.quoteChangePct)}): the ringgit strengthens in the model. Real markets may react differently.`,
};
