/**
 * Learn More topics (level 3 of the progressive disclosure). The long-form v1
 * text lives here, so the main screens can stay short. Numbers inside the text
 * come from the engine at load time, never typed by hand.
 */
import { calculate } from '../lib/finance';
import { formatPctChange, formatPpAbs, formatSpotUnit } from '../lib/format';
import { CANNOT_CLAIM, SCENARIO_B_CAVEAT } from '../lib/interpretation';
import { PRESETS } from '../lib/scenarios';
import { AUDIENCE, CONFUSIONS, MODEL_ASSUMPTIONS, OBJECTIVES, TESTS_NOTE } from './about';
import { EQUATIONS, type EquationId, CIP_DERIVATION, NOTATION } from './formulas';
import { GLOSSARY } from './glossary';
import { LIMITATIONS } from './limitations';
import { REFERENCES } from './references';

export type TopicId =
  | 'reading-rates'
  | 'fisher'
  | 'exact-vs-approx'
  | 'glossary'
  | 'ppp'
  | 'covered-irp'
  | 'ife'
  | 'forward-equals-ppp'
  | 'advanced-lab'
  | 'six-scenarios'
  | 'limitations'
  | 'about';

export type TopicGroup = 'basics' | 'theories' | 'deeper';

export type TopicIcon =
  'swap' | 'percent' | 'approx' | 'book' | 'basket' | 'route' | 'telescope' | 'equal' | 'lab' | 'table' | 'shield' | 'info';

export type Topic = {
  id: TopicId;
  group: TopicGroup;
  title: string;
  teaser: string;
  icon: TopicIcon;
  /** 1–2 plain-language sentences shown first. */
  intro: string[];
  /** "In more detail": paragraphs moved from v1 explanations. */
  details: string[];
  /** Equations shown in the detail section. */
  equations: EquationId[];
  /** At most three. */
  assumptions: string[];
  /** Other text rendered on the page (tables, lists), counted for the reading time. */
  extraText?: string[];
};

export const TOPIC_GROUPS: { id: TopicGroup; title: string }[] = [
  { id: 'basics', title: 'Basics' },
  { id: 'theories', title: 'The theories' },
  { id: 'deeper', title: 'Going deeper' },
];

const A = calculate(PRESETS.A.inputs);
const B = calculate(PRESETS.B.inputs);
const ADV = calculate(PRESETS.ADV.inputs);

export const TOPICS: Topic[] = [
  {
    id: 'reading-rates',
    group: 'basics',
    title: 'Reading exchange rates',
    teaser: 'What MYR/USD means, and which way is stronger.',
    icon: 'swap',
    intro: [
      'MYR/USD is the number of ringgit you pay for one US dollar.',
      'A lower number means the ringgit is stronger; a higher number means it is weaker.',
    ],
    details: [
      'S is quoted as MYR per 1 USD (MYR/USD). A rise in S means USD appreciation and MYR depreciation; a fall in S means USD depreciation and MYR appreciation. The reciprocal 1/S is USD per MYR and moves the opposite way.',
      `Example: ${formatSpotUnit(A.spot)} → ${formatSpotUnit(A.pppSpot)} means USD 1 now costs fewer ringgit, so the MYR is stronger (it appreciates). A higher number would mean the MYR is weaker.`,
      'Two percentages describe the same move. The quote change, 100 × (S₁/S₀ − 1), is the change in MYR per USD. The MYR value change, 100 × (S₀/S₁ − 1), is the change in what one ringgit is worth in US dollars.',
      'Every exchange rate in ParityLab uses this one convention, and every rate on screen carries the label MYR/USD.',
    ],
    equations: ['myr-value'],
    assumptions: [
      'All rates are hypothetical teaching values, not live quotes.',
      'One quote convention everywhere: MYR per 1 USD.',
    ],
  },
  {
    id: 'fisher',
    group: 'basics',
    title: 'Nominal vs real — the Fisher Effect',
    teaser: 'Why a 1.5% real rate becomes 4.0375%.',
    icon: 'percent',
    intro: ['A nominal interest rate is the rate in money terms. The real rate is what is left after expected inflation.'],
    details: [
      'Fisher: 1 + i = (1 + r)(1 + π). The nominal rate is the real rate plus expected inflation plus a small cross-term r × π, which the shortcut i ≈ r + π leaves out.',
      'With r = 1.5%, +1 pp expected inflation raises the Fisher-implied nominal rate by 1.015 pp (∂i/∂π = 1 + r).',
      'A Fisher-implied rate is not automatically the policy rate or a deposit rate. ParityLab labels it a Fisher-implied nominal rate for that reason.',
    ],
    equations: ['fisher'],
    assumptions: [
      'Inflation inputs are expected inflation assumptions, not published inflation.',
      'Annual effective rates over one year, one compounding period.',
      'Core mode uses one real rate for both countries.',
    ],
  },
  {
    id: 'exact-vs-approx',
    group: 'basics',
    title: 'Exact vs approximate formulas',
    teaser: 'The classroom shortcuts, and how far off they are.',
    icon: 'approx',
    intro: [
      'Textbooks often use shortcuts such as i ≈ r + π. ParityLab always calculates with the exact formula and shows the shortcut only for comparison.',
    ],
    details: [
      'ParityLab always calculates with the exact formula. Approximations appear only as labelled comparisons. Inputs are converted from percentages to decimals once, and nothing is rounded until display (4 dp).',
      `Example, Scenario B: the shortcut (π_MY − π_US) × 100 gives ${formatPctChange(B.quoteChangeApproxPct)}, but the exact change is ${formatPctChange(B.quoteChangePct)}, so the shortcut overstates the fall by ${formatPpAbs(B.approxErrorPp)}.`,
      'The error grows with the size of the inflation gap and with the level of US inflation.',
    ],
    equations: ['fisher', 'ppp', 'cip', 'ife'],
    assumptions: [
      'Every result uses the exact formula; shortcuts are comparisons only.',
      'Rounding happens only on screen, at 4 decimal places.',
    ],
  },
  {
    id: 'glossary',
    group: 'basics',
    title: 'Glossary',
    teaser: 'Plain definitions of every term used.',
    icon: 'book',
    intro: ['Short definitions of the terms used in ParityLab. Type in the box to filter them.'],
    details: [
      'A difference between two rates is in percentage points (pp); a change in a level, such as an exchange rate, is in percent (%).',
    ],
    equations: [],
    assumptions: ['MYR/USD (ringgit per US dollar) is the only quote convention used.'],
    extraText: [...GLOSSARY.map((g) => `${g.term} ${g.definition}`), ...NOTATION.map((n) => `${n.meaning} ${n.unit}`)],
  },
  {
    id: 'ppp',
    group: 'theories',
    title: 'Purchasing Power Parity',
    teaser: 'How an inflation gap moves the exchange rate.',
    icon: 'basket',
    intro: [
      'If prices rise faster in one country, its money buys less. Relative PPP turns the inflation gap into an implied future exchange rate.',
    ],
    details: [
      'Relative PPP says the exchange rate adjusts for the inflation difference between two countries: S₁ = S₀ × (1 + π_MY)/(1 + π_US). It is best treated as a long-run benchmark.',
      'US inflation sits in the denominator. A bigger denominator gives a smaller MYR/USD number: USD 1 costs fewer ringgit, so the MYR appreciates — within the model only.',
      'The PPP-implied future spot is a model scenario, not a prediction of the rate you will see in one year.',
      'Non-traded goods, transport costs, tariffs, sticky prices and different baskets can make relative PPP diverge from reality.',
    ],
    equations: ['ppp'],
    assumptions: [
      'PPP is a long-run benchmark, not a forecast.',
      'One-year horizon from the same spot rate.',
      'No transport costs, tariffs or basket differences.',
    ],
  },
  {
    id: 'covered-irp',
    group: 'theories',
    title: 'Covered Interest Rate Parity',
    teaser: 'Two ways to invest RM 1 must pay the same.',
    icon: 'route',
    intro: [
      'Investing at home, or converting, investing abroad and locking in the rate back with a forward, must pay the same. That no-arbitrage rule sets the forward rate.',
    ],
    details: [
      'The forward rate is a contract price for a future exchange. It is not the market’s guaranteed forecast of the future spot rate, and ideal CIP ignores bid–ask spreads, funding and collateral costs, counterparty differences and the cross-currency basis.',
      'Covered interest parity: with no arbitrage, hedged investing at home or abroad earns the same, so F = S₀ × (1 + i_MY)/(1 + i_US). Real markets show deviations (costs, credit, cross-currency basis).',
      'USD forward premium (+) or discount (−) = 100 × (F/S₀ − 1). A negative value means the US dollar trades at a forward discount.',
    ],
    equations: ['cip'],
    assumptions: [
      'No transaction costs, taxes, capital controls, credit risk or risk premia.',
      'Matching one-year maturities for the rates and the forward.',
      'The result is theoretical, never a bank quote.',
    ],
    extraText: CIP_DERIVATION.map((s) => s.text),
  },
  {
    id: 'ife',
    group: 'theories',
    title: 'International Fisher Effect',
    teaser: 'Same algebra as the forward, different meaning.',
    icon: 'telescope',
    intro: [
      'The International Fisher Effect links the interest-rate gap to the expected change in the spot rate. Same formula as covered IRP, but it gives an expectation, not a price.',
    ],
    details: [
      'It relates the expected change in the spot rate to the nominal interest-rate differential. It uses the same algebra as CIP but describes an expectation, not a tradable price, and often fails in practice.',
      'An expected spot rate is what a model or an investor expects the spot rate to be at a future date. The PPP-implied and IFE values are model-based expected spots — they can differ greatly from what actually happens.',
      'A forward, by contrast, is a price agreed today for an exchange on a future date.',
    ],
    equations: ['ife'],
    assumptions: [
      'An expectation, not a tradable price.',
      'It shows the same number as the forward because both use the same formula.',
    ],
  },
  {
    id: 'forward-equals-ppp',
    group: 'theories',
    title: 'Why the forward equals PPP here',
    teaser: 'The shared real rate cancels out.',
    icon: 'equal',
    intro: [
      'In core mode both countries share one real rate. That common factor cancels, so the forward and the PPP rate come out as the same number.',
    ],
    details: [
      'In core mode both countries share one real rate r. Substitute the Fisher equation into covered IRP and the factor (1 + r) cancels, so the two numbers coincide.',
      'They remain different economic objects: the forward is a contract price agreed today; the PPP value is a model scenario for the future spot rate.',
      'The equality holds only inside this simplified model — it is not evidence that forwards predict spot rates.',
    ],
    equations: ['cancel'],
    assumptions: [
      'Holds only when both real rates are equal.',
      'Same number, different objects: a price versus a model scenario.',
    ],
  },
  {
    id: 'advanced-lab',
    group: 'deeper',
    title: 'When PPP and the forward disagree',
    teaser: 'Give each country its own real rate.',
    icon: 'lab',
    intro: [
      'Give Malaysia and the US different real rates and the (1 + r) factors no longer cancel. The forward and the PPP rate split apart.',
    ],
    details: [
      'Core mode gives both countries the same real interest rate, so the PPP-implied spot and the covered-IRP forward are numerically equal. Advanced mode lets you set r_MY and r_US separately and shows why the two then differ: F/S_PPP = (1 + r_MY)/(1 + r_US).',
      `Example: r_MY 1.50%, r_US 2.50%, baseline inflation. PPP stays at ${formatSpotUnit(ADV.pppSpot)} but the covered forward becomes ${formatSpotUnit(ADV.cipForward)} — a gap of ${formatSpotUnit(Math.abs(ADV.parityGap))}.`,
      'That gap is not a bug: different real-rate assumptions change the model. The equality of PPP, IFE and CIP breaks when real-rate assumptions diverge.',
    ],
    equations: ['separate'],
    assumptions: [
      'Inflation and the spot rate come from your simulator inputs.',
      'PPP ignores real rates; the forward uses them.',
    ],
  },
  {
    id: 'six-scenarios',
    group: 'deeper',
    title: 'Six example scenarios',
    teaser: 'Cases A–F side by side, worked out in your browser.',
    icon: 'table',
    intro: [
      'Six one-year scenarios from the same spot rate show how the inflation gap drives the result. Every number is calculated in your browser by the engine.',
    ],
    details: [
      'Each row is a separate one-year scenario from the same spot rate, not a time series.',
      'Comparative statics: with r = 1.5%, +1 pp expected inflation raises the Fisher-implied nominal rate by 1.015 pp (∂i/∂π = 1 + r). Raising π_US lowers the PPP-implied MYR/USD; raising π_MY raises it.',
    ],
    equations: ['statics'],
    assumptions: ['S₀ = 4.4000 MYR/USD and r = 1.50% in every case.', 'Each row is separate, not a time series.'],
  },
  {
    id: 'limitations',
    group: 'deeper',
    title: 'What this model can’t tell you',
    teaser: 'Where the clean maths stops.',
    icon: 'shield',
    intro: [
      'ParityLab shows what simple parity theory implies. Real exchange rates are driven by much more, so treat every result as a teaching scenario.',
    ],
    details: [
      'The clean parity formulas leave out much of what moves real exchange rates. The points below mark where ParityLab’s results stop and an uncertain forecast would begin.',
    ],
    equations: [],
    assumptions: ['Arithmetic correctness is not forecasting skill.', 'No user testing has been performed.'],
    extraText: [
      ...LIMITATIONS.map((l) => `${l.limitation} ${l.why} ${l.safeguard}`),
      ...CANNOT_CLAIM,
      SCENARIO_B_CAVEAT,
      TESTS_NOTE,
      ...MODEL_ASSUMPTIONS,
    ],
  },
  {
    id: 'about',
    group: 'deeper',
    title: 'References and About',
    teaser: 'Course, sources and how the numbers are checked.',
    icon: 'info',
    intro: ['ParityLab is a teaching tool for UTP GFB3043 / GEB3043 International Financial Management (CLO3).'],
    details: [AUDIENCE],
    equations: [],
    assumptions: ['All rates are hypothetical teaching assumptions.', 'Runs offline; nothing is sent anywhere.'],
    extraText: [
      ...OBJECTIVES.map((o) => `${o.verb} ${o.text}`),
      ...CONFUSIONS.map((c) => `${c.title} ${c.text}`),
      ...REFERENCES.map((r) => `${r.authors} ${r.title} ${r.rest ?? ''} ${r.usedFor}`),
    ],
  },
];

export const TOPIC_IDS: TopicId[] = TOPICS.map((t) => t.id);

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as string[]).includes(value);
}

export function getTopic(id: TopicId): Topic {
  const topic = TOPICS.find((t) => t.id === id);
  if (!topic) throw new Error(`Unknown topic ${id}`);
  return topic;
}

/** Previous and next topic in hub order (null at either end). */
export function neighbours(id: TopicId): { prev: Topic | null; next: Topic | null } {
  const k = TOPIC_IDS.indexOf(id);
  return { prev: k > 0 ? TOPICS[k - 1] : null, next: k < TOPICS.length - 1 ? TOPICS[k + 1] : null };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
}

/** Reading time at 200 words per minute, from the topic's own text (minimum 1 minute). */
export function readingMinutes(topic: Topic): number {
  const text = [
    topic.title,
    ...topic.intro,
    ...topic.details,
    ...topic.assumptions,
    ...topic.equations.map((e) => `${EQUATIONS[e].name} ${EQUATIONS[e].note ?? ''}`),
    ...(topic.extraText ?? []),
  ].join(' ');
  return Math.max(1, Math.ceil(countWords(text) / 200));
}
