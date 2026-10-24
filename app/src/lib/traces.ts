/**
 * Formula traces for the output cards: general formula → numbers substituted →
 * result. Produces KaTeX source strings (ASCII only). Display-only: the numbers
 * shown here are formatted copies of unrounded engine values.
 */
import type { Results } from './finance';
import { fixed, formatDecimal, signedFixed } from './format';

export type TraceStep = { label: string; tex: string };
export type Trace = { steps: TraceStep[]; note?: string };

/** TeX-safe number: ASCII minus. */
function n(x: number, maxDp = 10): string {
  return formatDecimal(x, maxDp).replace('\u2212', '-');
}
function f4(x: number): string {
  return fixed(x, 4).replace('\u2212', '-');
}
function s4(x: number): string {
  return signedFixed(x, 4).replace('\u2212', '-');
}
/** Wrap negatives in parentheses when substituted after an operator. */
function p(x: number, maxDp = 10): string {
  const text = n(x, maxDp);
  return x < 0 ? `(${text})` : text;
}

function realSymbol(r: Results, country: 'MY' | 'US'): string {
  return r.rMY === r.rUS ? 'r' : `r_{${country}}`;
}

export function fisherTrace(r: Results, country: 'MY' | 'US'): Trace {
  const rate = country === 'MY' ? r.rMY : r.rUS;
  const pi = country === 'MY' ? r.piMY : r.piUS;
  const nominalPct = country === 'MY' ? r.nominalMYPct : r.nominalUSPct;
  const approxPct = country === 'MY' ? r.nominalMYApproxPct : r.nominalUSApproxPct;
  const gap = country === 'MY' ? r.nominalMYApproxGapPp : r.nominalUSApproxGapPp;
  const rs = realSymbol(r, country);
  const i = `i_{${country}}`;
  const gross = (1 + rate) * (1 + pi);
  return {
    steps: [
      { label: 'General formula (exact Fisher)', tex: `${i} = (1 + ${rs})(1 + \\pi_{${country}}) - 1` },
      {
        label: 'Substitute the decimal inputs',
        tex: `${i} = (1 + ${p(rate)})(1 + ${p(pi)}) - 1 = ${n(1 + rate)} \\times ${n(1 + pi)} - 1 = ${n(gross)} - 1`,
      },
      { label: 'Result', tex: `${i} = ${n(gross - 1)} = ${f4(nominalPct)}\\%` },
      {
        label: 'Approximation (comparison only)',
        tex: `${i} \\approx ${rs} + \\pi_{${country}} = ${n(rate)} + ${p(pi)} = ${f4(approxPct)}\\%,\\quad \\text{exact} - \\text{approx} = ${rs}\\,\\pi_{${country}} \\times 100 = ${s4(gap)}\\text{ pp}`,
      },
    ],
  };
}

export function inflationGapTrace(r: Results): Trace {
  return {
    steps: [
      { label: 'General formula', tex: `(\\pi_{MY} - \\pi_{US}) \\times 100` },
      { label: 'Substitute', tex: `(${n(r.piMY)} - ${p(r.piUS)}) \\times 100` },
      { label: 'Result', tex: `= ${s4(r.inflationDiffPp)}\\text{ percentage points (pp)}` },
    ],
    note: 'Malaysia minus US. A negative gap means US expected inflation is higher.',
  };
}

export function differentialTrace(r: Results): Trace {
  return {
    steps: [
      { label: 'General formula', tex: `(i_{MY} - i_{US}) \\times 100` },
      { label: 'Substitute', tex: `(${n(r.nominalMYPct / 100)} - ${p(r.nominalUSPct / 100)}) \\times 100` },
      { label: 'Result', tex: `= ${s4(r.nominalDiffPp)}\\text{ percentage points (pp)}` },
    ],
    note: 'A difference between two rates is measured in percentage points, not percent.',
  };
}

export function pppTrace(r: Results): Trace {
  const ratio = (1 + r.piMY) / (1 + r.piUS);
  return {
    steps: [
      { label: 'General formula (relative PPP)', tex: `\\hat{S}^{PPP}_1 = S_0 \\times \\frac{1 + \\pi_{MY}}{1 + \\pi_{US}}` },
      {
        label: 'Substitute',
        tex: `\\hat{S}^{PPP}_1 = ${n(r.spot)} \\times \\frac{${n(1 + r.piMY)}}{${n(1 + r.piUS)}} = ${n(r.spot)} \\times ${n(ratio)}`,
      },
      { label: 'Result', tex: `\\hat{S}^{PPP}_1 = ${n(r.pppSpot)} \\approx ${f4(r.pppSpot)}\\ \\text{MYR/USD}` },
      {
        label: 'Exact change in the MYR/USD quote',
        tex: `\\left(\\frac{${n(r.pppSpot)}}{${n(r.spot)}} - 1\\right) \\times 100 = ${s4(r.quoteChangePct)}\\%`,
      },
      {
        label: "MYR's value in USD (reciprocal quote)",
        tex: `\\left(\\frac{${n(r.spot)}}{${n(r.pppSpot)}} - 1\\right) \\times 100 = ${s4(r.myrValueChangePct)}\\%`,
      },
    ],
    note: 'The quote change and the MYR value change are not exact negatives of each other.',
  };
}

export function cipTrace(r: Results): Trace {
  const iMY = r.nominalMYPct / 100;
  const iUS = r.nominalUSPct / 100;
  return {
    steps: [
      { label: 'General formula (covered IRP)', tex: `F_1 = S_0 \\times \\frac{1 + i_{MY}}{1 + i_{US}}` },
      { label: 'Substitute', tex: `F_1 = ${n(r.spot)} \\times \\frac{${n(1 + iMY)}}{${n(1 + iUS)}}` },
      { label: 'Result', tex: `F_1 = ${n(r.cipForward)} \\approx ${f4(r.cipForward)}\\ \\text{MYR/USD}` },
      {
        label: 'USD forward premium (+) / discount (-)',
        tex: `\\left(\\frac{F_1}{S_0} - 1\\right) \\times 100 = \\left(\\frac{${n(r.cipForward)}}{${n(r.spot)}} - 1\\right) \\times 100 = ${s4(r.usdForwardPremiumPct)}\\%`,
      },
    ],
    note: 'A forward is a contract price fixed today under no-arbitrage — not a forecast of the future spot rate.',
  };
}

export function ifeTrace(r: Results): Trace {
  const iMY = r.nominalMYPct / 100;
  const iUS = r.nominalUSPct / 100;
  return {
    steps: [
      { label: 'General formula (International Fisher Effect)', tex: `\\hat{S}^{IFE}_1 = S_0 \\times \\frac{1 + i_{MY}}{1 + i_{US}}` },
      { label: 'Substitute', tex: `\\hat{S}^{IFE}_1 = ${n(r.spot)} \\times \\frac{${n(1 + iMY)}}{${n(1 + iUS)}}` },
      { label: 'Result', tex: `\\hat{S}^{IFE}_1 = ${n(r.ifeSpot)} \\approx ${f4(r.ifeSpot)}\\ \\text{MYR/USD}\\quad (${s4(r.ifeChangePct)}\\%)` },
      {
        label: 'Approximation (comparison only)',
        tex: `\\Delta S_{\\%}^{IFE} \\approx (i_{MY} - i_{US}) \\times 100 = ${s4(r.ifeChangeApproxPct)}\\%`,
      },
    ],
    note: 'Same algebra as covered IRP, different meaning: an expected future spot rate, not a contract price.',
  };
}

export function approxTrace(r: Results): Trace {
  const d = r.piMY - r.piUS;
  return {
    steps: [
      {
        label: 'Approximate quote change',
        tex: `(\\pi_{MY} - \\pi_{US}) \\times 100 = (${n(r.piMY)} - ${p(r.piUS)}) \\times 100 = ${s4(r.quoteChangeApproxPct)}\\%`,
      },
      {
        label: 'Exact quote change',
        tex: `\\frac{\\pi_{MY} - \\pi_{US}}{1 + \\pi_{US}} \\times 100 = \\frac{${n(d)}}{${n(1 + r.piUS)}} \\times 100 = ${s4(r.quoteChangePct)}\\%`,
      },
      {
        label: 'Approximation error',
        tex: `\\text{approx} - \\text{exact} = ${s4(r.quoteChangeApproxPct)} - (${s4(r.quoteChangePct)}) = ${s4(r.approxErrorPp)}\\text{ pp}`,
      },
    ],
    note: 'The error grows with the size of the inflation gap and with the level of US inflation.',
  };
}

export function parityTrace(r: Results): Trace {
  if (r.rMY === r.rUS) {
    return {
      steps: [
        {
          label: 'Why CIP equals PPP here',
          tex: `\\frac{1 + i_{MY}}{1 + i_{US}} = \\frac{(1 + r)(1 + \\pi_{MY})}{(1 + r)(1 + \\pi_{US})} = \\frac{1 + \\pi_{MY}}{1 + \\pi_{US}}`,
        },
        { label: 'Hence', tex: `F_1 = S_0 \\frac{1 + i_{MY}}{1 + i_{US}} = S_0 \\frac{1 + \\pi_{MY}}{1 + \\pi_{US}} = \\hat{S}^{PPP}_1` },
      ],
      note: 'The common real rate (1 + r) cancels. This equality holds only inside the simplified model.',
    };
  }
  return {
    steps: [
      { label: 'With unequal real rates', tex: `\\frac{F_1}{\\hat{S}^{PPP}_1} = \\frac{1 + r_{MY}}{1 + r_{US}}` },
      {
        label: 'Substitute',
        tex: `\\frac{${n(1 + r.rMY)}}{${n(1 + r.rUS)}} = ${n(r.realRateRatio)},\\quad F_1 - \\hat{S}^{PPP}_1 = ${n(r.cipForward)} - ${n(r.pppSpot)} = ${n(r.parityGap)}\\ \\text{MYR/USD}`,
      },
    ],
    note: 'The gap is not a bug: different real-rate assumptions change the model.',
  };
}
