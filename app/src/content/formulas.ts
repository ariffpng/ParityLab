/**
 * Formula content moved from the v1 Methodology screen (KaTeX source, ASCII only).
 * Each Learn More topic shows the equations that belong to it.
 */

export type NotationRow = { tex: string; meaning: string; unit: string };

export const NOTATION: NotationRow[] = [
  { tex: String.raw`S_0`, meaning: 'Spot exchange rate today: MYR paid for USD 1 (hypothetical)', unit: 'MYR/USD' },
  {
    tex: String.raw`\hat{S}^{PPP}_1`,
    meaning: 'One-year PPP-implied future spot (model scenario, not a guaranteed outcome)',
    unit: 'MYR/USD',
  },
  { tex: String.raw`F_1`, meaning: 'One-year theoretical covered-IRP forward (not a tradable quote)', unit: 'MYR/USD' },
  { tex: String.raw`\hat{S}^{IFE}_1`, meaning: 'One-year IFE expected spot (an expectation, not a price)', unit: 'MYR/USD' },
  {
    tex: String.raw`\pi_{MY},\ \pi_{US}`,
    meaning: 'Expected one-year inflation assumptions',
    unit: 'decimal in formulas (2.5% = 0.025)',
  },
  {
    tex: String.raw`r,\ r_{MY},\ r_{US}`,
    meaning: 'Assumed one-year real interest rates (common r in core mode)',
    unit: 'decimal',
  },
  { tex: String.raw`i_{MY},\ i_{US}`, meaning: 'One-year effective Fisher-implied nominal interest rates', unit: 'decimal' },
  { tex: String.raw`\Delta S/S_0`, meaning: 'Percentage change in the MYR/USD quotation', unit: '%' },
];

export type EquationId = 'fisher' | 'ppp' | 'myr-value' | 'cip' | 'ife' | 'separate' | 'statics' | 'cancel';

export type Equation = { id: EquationId; name: string; exact: string; approx?: string; note?: string };

export const EQUATIONS: Record<EquationId, Equation> = {
  fisher: {
    id: 'fisher',
    name: 'Fisher effect',
    exact: String.raw`1 + i_j = (1 + r_j)(1 + \pi_j) \;\Rightarrow\; i_j = r_j + \pi_j + r_j\pi_j`,
    approx: String.raw`i_j \approx r_j + \pi_j`,
  },
  ppp: {
    id: 'ppp',
    name: 'Relative PPP',
    exact: String.raw`\hat{S}^{PPP}_1 = S_0\,\frac{1+\pi_{MY}}{1+\pi_{US}}, \qquad \Delta S^{PPP}_{\%} = \frac{\pi_{MY}-\pi_{US}}{1+\pi_{US}} \times 100`,
    approx: String.raw`\Delta S^{PPP}_{\%} \approx (\pi_{MY}-\pi_{US}) \times 100`,
  },
  'myr-value': {
    id: 'myr-value',
    name: 'MYR value change in USD terms',
    exact: String.raw`\left(\frac{S_0}{\hat{S}^{PPP}_1} - 1\right) \times 100 = \left(\frac{1+\pi_{US}}{1+\pi_{MY}} - 1\right) \times 100`,
    note: 'Not the exact negative of the quote change, except approximately for small moves.',
  },
  cip: {
    id: 'cip',
    name: 'Covered interest rate parity',
    exact: String.raw`F_1 = S_0\,\frac{1+i_{MY}}{1+i_{US}}, \qquad \text{USD forward premium (\%)} = \frac{i_{MY}-i_{US}}{1+i_{US}} \times 100`,
    approx: String.raw`\text{USD forward premium (\%)} \approx (i_{MY}-i_{US}) \times 100`,
  },
  ife: {
    id: 'ife',
    name: 'International Fisher effect',
    exact: String.raw`\hat{S}^{IFE}_1 = S_0\,\frac{1+i_{MY}}{1+i_{US}}`,
    approx: String.raw`\Delta S^{IFE}_{\%} \approx (i_{MY}-i_{US}) \times 100`,
    note: 'Same algebra as covered IRP, different meaning: an expected spot rate, not a contract price.',
  },
  separate: {
    id: 'separate',
    name: 'When PPP and CIP separate',
    exact: String.raw`\frac{F_1}{\hat{S}^{PPP}_1} = \frac{1+r_{MY}}{1+r_{US}}`,
    note: 'Equal to 1 when the real rates are equal (core mode).',
  },
  statics: {
    id: 'statics',
    name: 'Comparative statics',
    exact: String.raw`\frac{\partial \hat{S}^{PPP}_1}{\partial \pi_{US}} = -S_0\frac{1+\pi_{MY}}{(1+\pi_{US})^2} < 0, \quad \frac{\partial \hat{S}^{PPP}_1}{\partial \pi_{MY}} = \frac{S_0}{1+\pi_{US}} > 0, \quad \frac{\partial i_j}{\partial \pi_j} = 1 + r_j`,
    note: 'Mathematical comparative statics, not estimated causal effects from historical data.',
  },
  cancel: {
    id: 'cancel',
    name: 'Covered IRP with a common real rate',
    exact: String.raw`F_1 = S_0\,\frac{1+i_{MY}}{1+i_{US}} = S_0\,\frac{(1+r)(1+\pi_{MY})}{(1+r)(1+\pi_{US})} = S_0\,\frac{1+\pi_{MY}}{1+\pi_{US}} = \hat{S}^{PPP}_1`,
  },
};

/** The v1 five-step covered-IRP derivation, now the captions of the two-route stepper. */
export const CIP_DERIVATION: { text: string; tex: string }[] = [
  { text: 'Invest MYR 1 domestically for one year.', tex: String.raw`\text{MYR } 1 \;\to\; \text{MYR } (1+i_{MY})` },
  { text: 'Or convert MYR 1 to USD at today’s spot.', tex: String.raw`\text{MYR } 1 \div S_0 = \text{USD } \tfrac{1}{S_0}` },
  { text: 'Earn US interest for one year.', tex: String.raw`\text{USD } \tfrac{1+i_{US}}{S_0}` },
  {
    text: 'Contract today to sell those future USD for MYR at the forward rate F₁.',
    tex: String.raw`\text{MYR } \tfrac{F_1(1+i_{US})}{S_0}`,
  },
  {
    text: 'No arbitrage: both covered routes must pay the same. Solve for F₁.',
    tex: String.raw`1+i_{MY} = \frac{F_1(1+i_{US})}{S_0} \;\Rightarrow\; F_1 = S_0\,\frac{1+i_{MY}}{1+i_{US}}`,
  },
];
