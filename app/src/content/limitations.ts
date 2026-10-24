/** Report §5.5 — interpretation risks and model limitations. */
export type Limitation = { limitation: string; why: string; safeguard: string };

export const LIMITATIONS: Limitation[] = [
  {
    limitation: 'Short-run exchange-rate volatility',
    why: 'Capital flows and expectations can dominate price-level adjustments.',
    safeguard: 'PPP is labelled a longer-run theoretical benchmark, not a forecast.',
  },
  {
    limitation: 'Inflation surprise vs inflation expectation',
    why: 'An unexpected published CPI reading is not the same as a one-year expected inflation assumption.',
    safeguard: 'Inputs are named “expected inflation assumption”, not “today’s inflation”.',
  },
  {
    limitation: 'Monetary-policy reaction',
    why: 'Higher inflation may prompt higher policy rates and short-run currency appreciation.',
    safeguard: 'Scenario B carries an explicit caveat; the app does not predict the immediate USD reaction.',
  },
  {
    limitation: 'Different real rates',
    why: 'The equality of PPP, IFE and CIP breaks when real-rate assumptions diverge.',
    safeguard: 'The equal-real-rate assumption is shown explicitly; Advanced mode demonstrates the gap.',
  },
  {
    limitation: 'Currency quote convention',
    why: 'A lower MYR/USD can look like “the currency falling” unless the currency is named.',
    safeguard: 'Every rate shows “MYR/USD” and “USD 1 costs RM …”, with direction in words and arrows.',
  },
  {
    limitation: 'Costs, trade barriers and price measurement',
    why: 'Non-traded goods, transport costs, tariffs, sticky prices and different baskets let relative PPP diverge from reality.',
    safeguard: 'Stated as a model limitation; results are labelled model scenarios.',
  },
  {
    limitation: 'Forward-market frictions',
    why: 'Actual forwards can deviate from ideal CIP because of bid–ask spreads, credit and the cross-currency basis.',
    safeguard: 'The output is called a “theoretical covered-IRP forward”, never a bank quote.',
  },
  {
    limitation: 'Nominal interest rate source',
    why: 'A Fisher-implied rate is not automatically the policy rate or a deposit rate.',
    safeguard: 'The output is called a “Fisher-implied nominal rate”.',
  },
  {
    limitation: 'Model validation',
    why: 'Arithmetic correctness does not establish forecasting skill.',
    safeguard: 'Software tests are kept separate from market back-testing and learner assessment.',
  },
];
