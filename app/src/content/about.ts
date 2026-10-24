/** Course and audience text moved from the v1 Welcome and Methodology screens. */

export const APP_TITLE = 'ParityLab: Visual FX & Inflation Simulator';

export const TAGLINE =
  'Change one macroeconomic assumption; see the mathematics, direction and limitations across the whole parity chain.';

/** The group number, defined once and imported wherever it is shown. */
export const GROUP_LABEL = 'Group 06';

export const PROGRAMME = 'Bachelor of Computer Science (Hons)';

export const TEAM_MEMBERS = [
  { name: 'Ariff Bin Azemi', id: '22004594' },
  { name: 'Muhammad Haikal bin Man Ghazali', id: '22002780' },
  { name: 'Nur Nafiesa Binti Nor Haizon', id: '22005608' },
  { name: 'Nursyasya Batrisyia Binti Zulkiflee', id: '22003205' },
];

/** Written by the group. */
export const AI_USE_DISCLOSURE =
  'Generative AI tools were used in this project. Claude Code was used to write the ParityLab web application, its automated tests, the independent Python verification script and the project documentation. All formulas, scenarios and reference values come from the group’s project report and the course materials. All rates are hypothetical teaching values. The group takes full responsibility for all submitted work. No personal or private data was given to any AI tool.';

export const COURSE = 'GFB3043 / GEB3043 International Financial Management, Universiti Teknologi PETRONAS';
export const CHALLENGE = 'FinBridge AI Innovation Challenge — CLO3';
export const CLO3 = 'Analyse the relationship among interest rate, inflation rate, and foreign exchange movement.';

export const AUDIENCE =
  'Non-finance undergraduates and entry-level business learners who need to connect interest rates, inflation and exchange-rate movements — without a finance background.';

export const OBJECTIVES = [
  { verb: 'Apply', text: 'calculate nominal interest rates, relative PPP and covered IRP with correct units.' },
  { verb: 'Analyse', text: 'explain why inflation differentials change MYR/USD and the Fisher-implied rate differential.' },
  { verb: 'Evaluate', text: 'identify which assumptions make parity results coincide, and why real markets can differ.' },
  { verb: 'Create', text: 'explain a new scenario in your own words, backed by a reproducible calculation.' },
];

export const CONFUSIONS = [
  {
    title: 'Nominal vs real',
    text: 'Reading a nominal interest rate as the true purchasing-power return, overlooking expected inflation.',
  },
  {
    title: 'Quote direction',
    text: 'Seeing MYR/USD fall from 4.4000 to 4.3786 and concluding the ringgit weakened — it actually strengthened.',
  },
  {
    title: 'Forecast vs price',
    text: 'Treating a PPP scenario as a guaranteed forecast, or a covered forward as a prediction of the future spot.',
  },
];

export const CONFUSIONS_NOTE = 'These are hypothesised learning difficulties, not measured findings.';

/** The full v1 assumptions list (Methodology). Topic pages show at most three. */
export const MODEL_ASSUMPTIONS = [
  'One-year horizon for every relationship (Fisher, PPP, IFE and covered IRP).',
  'Annual effective rates with one period of compounding; no day-count adjustment.',
  'Matching maturities for the interest rates and the forward contract.',
  'No transaction costs, taxes, capital controls, credit risk or risk premia.',
  'Core mode: one common real interest rate for both countries. Advanced mode relaxes this.',
  'All rates must exceed −100% so every gross factor (1 + rate) is positive; the app enforces narrower teaching ranges.',
  'All inputs are hypothetical teaching assumptions — not observed or live market data.',
];

export const TESTS_NOTE = 'Software tests establish arithmetic validity only — not forecast accuracy or learning effectiveness.';

export const EXPORT_NOTE =
  'Copied summaries and CSV files are created in your browser only; both include the “Illustrative model — not a trading forecast” notice.';

export const LINKS_NOTE = 'Links open the publisher’s site in a new tab. ParityLab itself makes no network requests.';
