import type { TopicId } from '../content/topics';

export type MathId = 'ppp' | 'inflation' | 'nominal' | 'forward' | 'fisher-my' | 'fisher-us';

/** Title, related Learn More topic and topic name for each "Show the math" drawer. */
export const MATH_META: Record<MathId, { title: string; topic: TopicId; about: string }> = {
  ppp: { title: 'PPP future rate', topic: 'ppp', about: 'Purchasing Power Parity' },
  inflation: { title: 'Inflation gap', topic: 'ppp', about: 'Purchasing Power Parity' },
  nominal: { title: 'Nominal interest rates', topic: 'fisher', about: 'the Fisher Effect' },
  forward: { title: 'Forward rate (theoretical)', topic: 'covered-irp', about: 'Covered Interest Rate Parity' },
  'fisher-my': { title: 'Malaysia nominal interest rate', topic: 'fisher', about: 'the Fisher Effect' },
  'fisher-us': { title: 'US nominal interest rate', topic: 'fisher', about: 'the Fisher Effect' },
};
