export type GlossaryEntry = { term: string; definition: string };

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Spot rate (S₀)',
    definition:
      'The exchange rate for buying currency today. In ParityLab it is quoted as MYR per 1 USD (MYR/USD). The 4.4000 baseline is a hypothetical teaching value, not a live quote.',
  },
  {
    term: 'Forward rate (F)',
    definition:
      'A price agreed today for exchanging currencies on a future date. It is a contract price, not a forecast of the future spot rate.',
  },
  {
    term: 'Expected spot rate',
    definition:
      'What a model or an investor expects the spot rate to be at a future date. The PPP-implied and IFE values are model-based expected spots — they can differ greatly from what actually happens.',
  },
  {
    term: 'Nominal vs real interest rate',
    definition:
      'A nominal rate is the quoted rate of return in money terms. A real rate is the return in purchasing-power terms after expected inflation. Fisher: 1 + i = (1 + r)(1 + π).',
  },
  {
    term: 'Percentage point (pp) vs percentage change (%)',
    definition:
      'A percentage-point difference subtracts two rates directly (4.0375% − 4.5450% = −0.5075 pp). A percentage change compares a new level with an old level (4.3786 vs 4.4000 is a −0.4854% change).',
  },
  {
    term: 'Appreciation / depreciation',
    definition:
      'A currency appreciates when it buys more of the other currency. With MYR/USD, a LOWER number means USD 1 costs fewer ringgit, so the MYR has appreciated; a HIGHER number means the MYR has depreciated.',
  },
  {
    term: 'Purchasing Power Parity (PPP)',
    definition:
      'Relative PPP says the exchange rate adjusts for the inflation difference between two countries: S₁ = S₀ × (1 + π_MY)/(1 + π_US). It is best treated as a long-run benchmark.',
  },
  {
    term: 'Interest Rate Parity (IRP / CIP)',
    definition:
      'Covered interest parity: with no arbitrage, hedged investing at home or abroad earns the same, so F = S₀ × (1 + i_MY)/(1 + i_US). Real markets show deviations (costs, credit, cross-currency basis).',
  },
  {
    term: 'International Fisher Effect (IFE)',
    definition:
      'Relates the expected change in the spot rate to the nominal interest-rate differential. It uses the same algebra as CIP but describes an expectation, not a tradable price, and often fails in practice.',
  },
];
