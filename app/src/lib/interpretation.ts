/**
 * Rule-based interpretation engine (report §4.6). Deterministic templates filled
 * with live numbers — no language model. Text may contain **bold** markers, which
 * the UI renders as <strong>; plain-text exports strip them.
 */
import { DIRECTION_EPSILON, type Inputs, type MyrDirection, type Results } from './finance';
import {
  formatInputPct,
  formatInputPp,
  formatDecimal,
  formatPctChange,
  formatRinggit,
  formatSpot,
  formatSpotUnit,
  fixed,
} from './format';
import { BASELINE } from './scenarios';

export const DISCLAIMER =
  'Illustrative model — not a trading forecast. All rates are hypothetical teaching assumptions.';

export const FOOTER_NOTE = 'These are hypothetical parity implications, not observed market rates.';

export const SCENARIO_B_CAVEAT =
  'A real US inflation surprise could trigger expected Fed tightening, capital inflows and even near-term USD strength. This result is a conditional PPP implication, not a prediction of the market reaction.';

export const CANNOT_CLAIM: string[] = [
  'Short-run volatility: capital flows and expectations can dominate price-level adjustment over months, so actual MYR/USD can move the other way.',
  'Central-bank reaction: higher expected inflation may prompt Bank Negara Malaysia or the Fed to change policy rates, which this model does not simulate.',
  'Forward-market frictions: real forward quotes include bid–ask spreads, credit and funding costs and the cross-currency basis; the CIP figure here is theoretical.',
  'PPP is a long-run benchmark: the PPP-implied spot is a model scenario, not a prediction of the rate you will see in one year.',
];

export type InflationCase = 'us-higher' | 'my-higher' | 'equal';

export type Interpretation = {
  inflationCase: InflationCase;
  /** One-line headline, e.g. "MYR appreciates against USD (in this model)". */
  headline: string;
  /** The main PPP direction message (template with live numbers). */
  directionMessage: string;
  /** "USD 1 costs RM X instead of RM S0". */
  costSentence: string;
  changed: string[];
  heldConstant: string[];
  /** Why PPP and CIP match (core) or differ (advanced). */
  parityMessage: string;
  /** Present only when US inflation is raised above the baseline assumption. */
  caveat: string | null;
  cannotClaim: string[];
  footer: string;
};

export function inflationCase(piMY: number, piUS: number): InflationCase {
  const d = piMY - piUS;
  if (d < -DIRECTION_EPSILON) return 'us-higher';
  if (d > DIRECTION_EPSILON) return 'my-higher';
  return 'equal';
}

function directionMessage(r: Results): string {
  const myPct = formatInputPct(r.piMY * 100);
  const usPct = formatInputPct(r.piUS * 100);
  const gap = formatInputPp(Math.abs(r.inflationDiffPp));
  const s0 = formatSpot(r.spot);
  const s1 = formatSpot(r.pppSpot);
  const q = fixed(Math.abs(r.quoteChangePct), 4);
  const v = fixed(Math.abs(r.myrValueChangePct), 4);

  switch (inflationCase(r.piMY, r.piUS)) {
    case 'us-higher':
      return (
        `US expected inflation (${usPct}) exceeds Malaysian expected inflation (${myPct}) by ${gap}. ` +
        `Relative PPP implies a **lower MYR/USD** value: from ${s0} to ${s1} MYR/USD (a ${q}% decrease in MYR per USD). ` +
        `In this model USD depreciates and **MYR appreciates**; the MYR's value in USD rises by ${v}%.`
      );
    case 'my-higher':
      return (
        `Malaysian expected inflation (${myPct}) exceeds US expected inflation (${usPct}) by ${gap}. ` +
        `Relative PPP implies a **higher MYR/USD** value: from ${s0} to ${s1} MYR/USD (a ${q}% increase in MYR per USD). ` +
        `In this model USD appreciates and **MYR depreciates**; the MYR's value in USD falls by ${v}%.`
      );
    case 'equal':
      return (
        `Equal inflation assumptions (${myPct} in both countries) imply **no PPP-based change** in MYR/USD, ` +
        `holding other variables fixed: the PPP-implied spot stays at ${s1} MYR/USD.`
      );
  }
}

function headline(r: Results): string {
  switch (r.myrDirection) {
    case 'appreciates':
      return 'MYR appreciates against USD (in this model)';
    case 'depreciates':
      return 'MYR depreciates against USD (in this model)';
    case 'unchanged':
      return 'No PPP-implied change in MYR/USD';
  }
}

function realRatesEqual(r: Results): boolean {
  return Math.abs(r.rMY - r.rUS) <= DIRECTION_EPSILON;
}

function parityMessage(r: Results): string {
  if (realRatesEqual(r)) {
    return (
      'Under equal real-rate assumptions, the theoretical covered forward and the PPP-implied spot have the same numerical value ' +
      `(${formatSpotUnit(r.cipForward)}) — but they remain **different economic objects**: a forward is a contract price, PPP is a model scenario.`
    );
  }
  const myGross = formatDecimal(1 + r.rMY);
  const usGross = formatDecimal(1 + r.rUS);
  return (
    'PPP and the covered forward differ because assumed real rates are unequal. ' +
    `F/S_PPP = (1 + r_MY)/(1 + r_US) = ${myGross}/${usGross} = ${formatDecimal(r.realRateRatio)}, ` +
    `so the forward (${formatSpotUnit(r.cipForward)}) sits ${fixed(Math.abs(r.parityGap), 4)} MYR/USD ` +
    `${r.parityGap < 0 ? 'below' : 'above'} the PPP-implied spot (${formatSpotUnit(r.pppSpot)}).`
  );
}

type Tracked = { label: string; current: number; baseline: number; unit: '%' | 'MYR/USD' };

function describe(t: Tracked): string {
  return t.unit === '%' ? formatInputPct(t.current) : formatSpotUnit(t.current);
}

/** Lists which assumptions differ from the Scenario A baseline and which were held constant. */
export function changesVsBaseline(x: Inputs, baseline: Inputs = BASELINE): { changed: string[]; held: string[] } {
  const tracked: Tracked[] = [
    { label: 'Malaysia expected inflation', current: x.myInflationPct, baseline: baseline.myInflationPct, unit: '%' },
    { label: 'US expected inflation', current: x.usInflationPct, baseline: baseline.usInflationPct, unit: '%' },
  ];
  if (x.advanced) {
    tracked.push(
      { label: 'Malaysia real rate', current: x.myRealRatePct ?? x.realRatePct, baseline: baseline.realRatePct, unit: '%' },
      { label: 'US real rate', current: x.usRealRatePct ?? x.realRatePct, baseline: baseline.realRatePct, unit: '%' },
    );
  } else {
    tracked.push({ label: 'Common real rate', current: x.realRatePct, baseline: baseline.realRatePct, unit: '%' });
  }
  tracked.push({ label: 'Spot S₀', current: x.spotMyrPerUsd, baseline: baseline.spotMyrPerUsd, unit: 'MYR/USD' });

  const changed: string[] = [];
  const held: string[] = [];
  for (const t of tracked) {
    if (t.current === t.baseline) {
      held.push(`${t.label} ${describe(t)}`);
    } else {
      const from: Tracked = { ...t, current: t.baseline };
      changed.push(`${t.label}: ${describe(from)} → ${describe(t)}`);
    }
  }
  held.push('One-year horizon, annual effective rates');
  return { changed, held };
}

export function interpret(x: Inputs, r: Results, baseline: Inputs = BASELINE): Interpretation {
  const { changed, held } = changesVsBaseline(x, baseline);
  const caveat = x.usInflationPct > baseline.usInflationPct ? SCENARIO_B_CAVEAT : null;
  return {
    inflationCase: inflationCase(r.piMY, r.piUS),
    headline: headline(r),
    directionMessage: directionMessage(r),
    costSentence:
      r.myrDirection === 'unchanged'
        ? `USD 1 still costs ${formatRinggit(r.pppSpot)} in the PPP scenario (no change from ${formatRinggit(r.spot)}).`
        : `USD 1 costs ${formatRinggit(r.pppSpot)} instead of ${formatRinggit(r.spot)} in the PPP scenario (quote change ${formatPctChange(r.quoteChangePct)}).`,
    changed,
    heldConstant: held,
    parityMessage: parityMessage(r),
    caveat,
    cannotClaim: CANNOT_CLAIM,
    footer: FOOTER_NOTE,
  };
}

/** One sentence comparing the approximate and exact PPP quote change. */
export function approxVerdict(r: Results): string {
  const gap = Math.abs(r.quoteChangeApproxPct) - Math.abs(r.quoteChangePct);
  const size = `${fixed(Math.abs(r.approxErrorPp), 4)} pp`;
  if (Math.abs(r.approxErrorPp) < 5e-13) return 'Here the approximation and the exact formula agree.';
  const move = r.quoteChangePct < 0 ? 'fall' : r.quoteChangePct > 0 ? 'rise' : 'move';
  return gap > 0
    ? `The approximation overstates the ${move} in MYR/USD by ${size}.`
    : `The approximation understates the ${move} in MYR/USD by ${size}.`;
}

/** Remove **bold** markers for plain-text output. */
export function stripMarkup(text: string): string {
  return text.replace(/\*\*/g, '');
}

/** Plain-language direction for the main screens ("Ringgit stronger"), always shown with an arrow. */
export function directionWords(direction: MyrDirection): string {
  switch (direction) {
    case 'appreciates':
      return 'Ringgit stronger';
    case 'depreciates':
      return 'Ringgit weaker';
    case 'unchanged':
      return 'No change';
  }
}

/** One plain sentence (≤ 20 words) for the Simulator's default view. */
export function oneLineSummary(r: Results): string {
  switch (inflationCase(r.piMY, r.piUS)) {
    case 'us-higher':
      return 'US inflation is higher, so the model expects a stronger ringgit.';
    case 'my-higher':
      return 'Malaysian inflation is higher, so the model expects a weaker ringgit.';
    case 'equal':
      return 'Inflation is equal, so the model expects no change in the ringgit.';
  }
}

/** Short Scenario B-style caveat (≤ 12 words); the full text is SCENARIO_B_CAVEAT. */
export const SPIKE_CALLOUT = 'Real markets may react differently: Fed tightening could lift the USD.';

/** Show the short caveat when US expected inflation exceeds Malaysia's by 1 pp or more. */
export function shouldShowSpikeCallout(x: Inputs): boolean {
  return x.usInflationPct - x.myInflationPct >= 1 - 1e-9;
}
