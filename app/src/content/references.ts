/**
 * The ONLY references ParityLab cites (project report §6, APA 7).
 * Do not add sources without the group's approval.
 */
export type Reference = {
  id: string;
  /** Text before the italic title. */
  authors: string;
  title: string;
  /** Text after the title (container, publisher, volume). */
  rest?: string;
  url?: string;
  urlLabel?: string;
  /** What ParityLab relies on it for (report traceability table). */
  usedFor: string;
};

export const REFERENCES: Reference[] = [
  {
    id: 'bnm-fx',
    authors: 'Bank Negara Malaysia. (n.d.).',
    title: 'Exchange rates',
    url: 'https://www.bnm.gov.my/exchange-rates',
    usedFor: 'Official potential source for dated Malaysian FX statistics (not used for the hypothetical 4.4000 baseline).',
  },
  {
    id: 'bnm-stats',
    authors: 'Bank Negara Malaysia. (n.d.).',
    title: 'Rates & statistics',
    url: 'https://www.bnm.gov.my/rates-statistics',
    usedFor: 'Official potential source for future validation with dated Malaysian data.',
  },
  {
    id: 'bekaert',
    authors: 'Bekaert, G., & Hodrick, R. J. (2017).',
    title: 'International financial management',
    rest: '(3rd ed.). Cambridge University Press.',
    url: 'https://www.cambridge.org/highereducation/books/international-financial-management/B7138AAA17C384543182C3AA48892984',
    usedFor: 'Textbook context for parity conditions and PPP limitations.',
  },
  {
    id: 'borio',
    authors: 'Borio, C., McCauley, R. N., McGuire, P., & Sushko, V. (2016).',
    title: 'Covered interest parity lost: Understanding the cross-currency basis',
    rest: '. BIS Quarterly Review.',
    url: 'https://www.bis.org/publications/qr-201609/covered-interest-parity-lost-understanding-cross-currency-basis',
    usedFor: 'Limits to ideal covered parity in real currency markets.',
  },
  {
    id: 'cfa',
    authors: 'CFA Institute. (2026).',
    title: 'Currency exchange rates: Understanding equilibrium value',
    url: 'https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/currency-exchange-rates-understanding-equilibrium-value',
    usedFor: 'Covered vs uncovered parity, PPP and the limits of FX prediction.',
  },
  {
    id: 'dallasfed',
    authors: 'Davis, S., & Sagnanert, P. (2024).',
    title: 'Impact of inflation shocks on foreign exchange rates reflects central bank stature',
    rest: '. Federal Reserve Bank of Dallas.',
    url: 'https://www.dallasfed.org/research/economics/2024/0903',
    usedFor: 'Why the market response to an inflation shock can differ from simple PPP intuition.',
  },
  {
    id: 'du',
    authors: 'Du, W., Tepper, A., & Verdelhan, A. (2018). Deviations from covered interest rate parity.',
    title: 'The Journal of Finance, 73',
    rest: '(3), 915–957.',
    url: 'https://doi.org/10.1111/jofi.12620',
    usedFor: 'Documented deviations from covered interest parity.',
  },
  {
    id: 'gavin',
    authors: 'Gavin, W. T., & Cooke, D. A. (2014).',
    title: 'The ups and downs of inflation and the role of Fed credibility',
    rest: '. Federal Reserve Bank of St. Louis.',
    url: 'https://www.stlouisfed.org/publications/regional-economist/april-2014/the-ups-and-downs-of-inflation-and-the-role-of-fed-credibility',
    usedFor: 'The standard Fisher real–nominal–inflation relationship.',
  },
  {
    id: 'madura',
    authors: 'Madura, J., & Zipfel, C. (2026).',
    title: 'International financial management',
    rest: '(15th ed.). Cengage.',
    url: 'https://www.cengageasia.com/title/default/detail?isbn=9798214040684',
    usedFor: 'Textbook context for Fisher, PPP, IRP and IFE.',
  },
  {
    id: 'utp',
    authors: 'Universiti Teknologi PETRONAS, Department of Management. (2026).',
    title: 'FinBridge AI innovation challenge: Group project assignment — International financial management',
    rest: '[Course brief].',
    usedFor: 'Assignment scope, rubric and deliverables.',
  },
];
