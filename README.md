# ParityLab: Visual FX & Inflation Simulator

*Change one macroeconomic assumption; see the mathematics, direction and limitations across the whole parity chain.*

> **Illustrative model — not a trading forecast. All rates are hypothetical teaching assumptions.**
> The 4.4000 MYR/USD starting spot rate and every inflation and interest rate in this project are controlled
> teaching values, not market quotations. Nothing in the app is a live rate or a forecast.

**Live demo:** <https://ariffpng.github.io/ParityLab/>

ParityLab is an offline, single-page web app built for the UTP **GFB3043 / GEB3043 International Financial
Management** group project (FinBridge AI Innovation Challenge). It helps **non-finance undergraduates** see how an
expected-inflation assumption flows through:

1. the **Fisher effect** → Fisher-implied nominal interest rates,
2. **relative PPP** → the PPP-implied future spot rate,
3. **covered interest rate parity** → the theoretical forward rate,
4. the **International Fisher Effect** → the expected future spot rate,

all quoted in one fixed convention: **S = MYR per 1 USD (MYR/USD)**. A higher number means a weaker ringgit;
a lower number means a stronger ringgit.

**Course learning outcome (CLO3):** *Analyse the relationship among interest rate, inflation rate, and foreign
exchange movement.* The app connects all three variables in one input → result → formula trace → plain-language
explanation → scenario comparison workflow.

---

## What the app does

Version 2 is a redesign of the interface only: the finance engine, the verified numbers and the honest labelling are
unchanged. Content is arranged in three levels — **glance** (main screens: one big answer, one visual, one
sentence) → **Show the math** (a slide-over drawer with the KaTeX formula trace) → **Learn More** (full theory,
derivations, limitations, glossary and references).

| Screen | What you can do |
|---|---|
| **Home** (`#/home`) | Headline, tagline and a live **currency see-saw** on the baseline (US$1 = RM 4.4000 → RM 4.3786 = ringgit stronger), a 3-step icon strip, and the 5-step **guided lesson** (≤ 25 words per step, predict Scenario B's direction before it is revealed). |
| **Simulator** (`#/simulator`) | A navy **"Your assumptions"** panel: sliders + number fields (kept in sync) for Malaysia and US inflation and the real rate, **Today's rate** (US$1 = RM …, hypothetical), six **preset chips** (Baseline · US inflation spike · Equal · MY higher · Extreme MY · Extreme US), reset, Send to Compare, copy summary, and **More options** (advanced mode with separate real rates). Results: the **PPP future rate** hero card with the see-saw and direction badge, an interactive **parity-flow diagram** (Inflation → Nominal rates → PPP rate = / ≠ Forward rate), three metric cards with **Fisher stacked bars**, and a one-sentence summary. Every card has **Show the math** and **Learn more →**. Invalid input shows a field error and **hides all results**. On phones the panel becomes a sticky, collapsible sheet. |
| **Compare** (`#/compare`) | Scenario A (baseline) vs an editable Scenario B (same chips, compact number editor): an animated **dumbbell chart** of MYR/USD today → in one year, a 4-row table with **Show all rows** (the full v1 comparison table), and tabs for the **draggable sensitivity curve**, a **π_MY × π_US heatmap** (click or Enter loads a cell into B) and the **six-case table** computed live. **Copy summary** and **Download CSV** (local only). |
| **Quiz** (`#/quiz`) | Five questions, one per screen, big answer buttons and a progress bar; feedback (one sentence + "See why →" + optional calculation) appears only after answering; score and a small celebration at the end. |
| **Learn More** (`#/learn`) | 12 topics in three rows — *Basics*: Reading exchange rates, Nominal vs real (Fisher), Exact vs approximate, Glossary · *The theories*: PPP (shopping-basket visual), Covered IRP (step-by-step two-route no-arbitrage), International Fisher Effect, Why the forward equals PPP here (animated cancellation) · *Going deeper*: When PPP and the forward disagree (advanced lab, 4.3786 vs 4.3359), Six example scenarios, What this model can't tell you, References and About. Each topic: short intro → interactive visual → "With your current numbers" (live KaTeX trace from the simulator) → the v1 long-form text → ≤ 3 key assumptions → Previous / Next. |

A **Presentation mode** icon (top right) enlarges all text and numbers for a screen recording. The mandatory notice
is a slim strip under the navigation on every screen and topic page, and it is included in every export. All routes
are hash links (`#/learn/ppp`, …), so the browser Back button works and pages can be linked directly.

### Interactive visuals (hand-written SVG, no chart library)

Currency see-saw (tilt 5° per 1% PPP move, capped at ±15°) · parity-flow diagram (nodes open their drawer; the
changed path pulses) · Fisher stacked bars (real + inflation + r·π = nominal) · dumbbell chart · draggable sensitivity
curve (mouse, touch or arrow keys; edits Scenario B) · sensitivity heatmap · shopping basket · two-route no-arbitrage
stepper · cancellation animation · number tweening (~300 ms). All update live from the engine, have an aria-label and
a hidden or toggleable data table, never use colour alone for direction, and become instant under
`prefers-reduced-motion`.

## Tech stack

- **Vite 7 + React 19 + TypeScript 5.9** (strict mode)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **KaTeX 0.16** for formula traces (fonts bundled, so it works offline)
- Hand-written SVG charts and diagrams, CSS transitions and a small number-tween hook (no chart or animation library;
  v2 added no dependencies)
- **Vitest 3** + React Testing Library + jsdom for tests; ESLint 9
- **Python 3** standard library (`decimal`) for the independent cross-check

No backend, database, login, analytics, live FX feed, LLM or AI API. All calculations run in the browser.

## Install and run

Requires **Node.js 20 or newer** (developed on Node 24.22.1 / npm 11.19.1). From the project root:

```powershell
cd app
npm install
npm run dev          # opens a local dev server (default http://localhost:5173)
```

## Tests and independent verification

```powershell
cd app
npm run test:run     # all unit + component tests once (npm test = watch mode)
npm run typecheck    # strict TypeScript
npm run lint         # ESLint
npm run reference-table   # prints the engine vs published reference values table
```

Independent Python check (from the project root; Python 3.8+):

```powershell
python verification/verify_paritylab.py
python verification/verify_paritylab.py --log logs/python_verification_output.txt   # optional log file
```

The Python script is a **separate implementation** using `decimal.Decimal` (precision 28). It asserts the published
reference values and writes `verification/expected_values.json`; the Vitest test `crosscheck.test.ts` then compares
that file against the TypeScript engine (tolerance 1e-9).

## Build

```powershell
cd app
npm run build        # type-checks, then writes the static site to app/dist/
npm run preview      # serves app/dist at http://localhost:4173 to check the build
```

`vite.config.ts` uses `base: './'`, so `app/dist/` works from any folder or static host, and it needs no network
connection after loading (fonts and KaTeX are bundled). For an offline demo you can also serve `app/dist/` with
`npm run preview` on the presenting laptop.

## Deployment

The site is deployed to **GitHub Pages** by the GitHub Actions workflow `.github/workflows/deploy.yml`. On every push
to the default branch (or when run manually) it installs dependencies with `npm ci`, runs the full test suite, builds
`app/dist/` and publishes it. The relative `base: './'` means the build works from the `/ParityLab/` subpath without
changes. Any other static host (Netlify, Vercel, a USB stick with `npm run preview`) can serve `app/dist/` as is.

The live URL can be turned into a **QR code** (any QR generator) for the A3 poster so viewers can open the simulator
on their phones. The layout is tested down to 390 px wide.

## Folder structure

```
ParityLab/
├── .github/workflows/deploy.yml   # build, test and deploy to GitHub Pages
├── app/                       # the web app
│   ├── src/lib/               # pure TypeScript: finance, validation, evaluate, scenarios, comparison (frozen engine),
│   │   │                      #   interpretation, format, traces, exportSummary, chips, visuals
│   │   └── __tests__/         # engine tests (T1–T9, cases D–F, approximations, cross-check, exports, visual data)
│   ├── src/components/        # UI components and hand-written SVG visuals; learn/ = Learn More visuals
│   ├── src/views/             # Home, Simulator, Compare, Quiz, Learn (hub + topic template)
│   ├── src/content/           # topics, formulas, glossary, quiz, lesson, limitations, references, about
│   ├── src/routes.ts          # hash routes        src/hooks/useTween.ts  number tween
│   ├── src/__tests__/         # UI tests (disclaimer, values, chips, sync, invalid input, drawers, routes, lesson, quiz…)
│   └── scripts/reference-table.ts
├── verification/
│   ├── verify_paritylab.py    # independent Python Decimal verification
│   └── expected_values.json   # its output, read by crosscheck.test.ts
└── README.md
```

## Formulas (one-year horizon, annual effective rates, decimals inside the engine)

| Relationship | Exact formula (used) | Approximation (comparison only) |
|---|---|---|
| Fisher | i = (1 + r)(1 + π) − 1 | i ≈ r + π |
| Relative PPP | S_PPP = S₀ (1 + π_MY)/(1 + π_US); quote Δ% = 100 (S_PPP/S₀ − 1) | Δ% ≈ (π_MY − π_US) × 100 |
| MYR value change | 100 (S₀/S_PPP − 1) | — |
| Covered IRP | F = S₀ (1 + i_MY)/(1 + i_US); USD premium % = 100 (F/S₀ − 1) | ≈ (i_MY − i_US) × 100 |
| IFE | Ŝ_IFE = S₀ (1 + i_MY)/(1 + i_US) — same algebra as CIP, but an *expected spot*, not a contract price | Δ% ≈ (i_MY − i_US) × 100 |
| Unequal real rates | F/S_PPP = (1 + r_MY)/(1 + r_US) | — |

Inputs and intermediate values are never rounded; display rounds exchange rates and rates to 4 dp. Rate differences
are in **percentage points (pp)**; changes in levels are in **percent (%)**.

**Baseline (Scenario A):** π_MY 2.50%, π_US 3.00%, r 1.50%, S₀ 4.4000 MYR/USD → i_MY 4.0375%, i_US 4.5450%,
i_MY − i_US −0.5075 pp, PPP = CIP = 4.3786 MYR/USD (quote −0.4854%, MYR value +0.4878%) → MYR appreciates
*within the model*.

## Data integrity notice

All rates are **hypothetical teaching assumptions**. The app does not fetch, store or claim any market data, and
it sends nothing anywhere (browser checks recorded zero external network requests).
Model outputs are labelled "Nominal interest rate (Fisher)", "PPP future rate" with a "model scenario" tag and "Forward
rate (theoretical)" on the main screens; the full labels ("Fisher-implied nominal rate", "PPP-implied future spot (model
scenario, long-run benchmark)", "Theoretical covered-IRP forward") are one step away in tooltips, drawers and Learn More.
Outputs are never called a "forecast", "live", "current rate" or "bank quote".

## Limitations

- **Short-run volatility:** capital flows and expectations can dominate price-level adjustment; PPP is a long-run benchmark.
- **Expected vs surprise inflation:** inputs are expectation assumptions, not published CPI surprises.
- **Monetary-policy reaction:** a real US inflation surprise could trigger Fed tightening and near-term USD strength;
  Scenario B is a conditional PPP implication, not a prediction of the market reaction.
- **Unequal real rates:** PPP, IFE and CIP coincide only under equal real rates (Advanced mode shows the gap).
- **Forward-market frictions:** real forwards include bid–ask spreads, credit and the cross-currency basis.
- **Costs, trade barriers and price measurement** can make relative PPP diverge from reality.
- **Nominal rate source:** a Fisher-implied rate is not a policy rate or a deposit rate.
- **Validation:** arithmetic correctness ≠ forecasting skill; software tests do not measure learning effectiveness,
  and no user testing has been performed.

## References

- Bank Negara Malaysia. (n.d.). *Exchange rates*. https://www.bnm.gov.my/exchange-rates
- Bank Negara Malaysia. (n.d.). *Rates & statistics*. https://www.bnm.gov.my/rates-statistics
- Bekaert, G., & Hodrick, R. J. (2017). *International financial management* (3rd ed.). Cambridge University Press. https://www.cambridge.org/highereducation/books/international-financial-management/B7138AAA17C384543182C3AA48892984
- Borio, C., McCauley, R. N., McGuire, P., & Sushko, V. (2016). *Covered interest parity lost: Understanding the cross-currency basis*. BIS Quarterly Review. https://www.bis.org/publications/qr-201609/covered-interest-parity-lost-understanding-cross-currency-basis
- CFA Institute. (2026). *Currency exchange rates: Understanding equilibrium value*. https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/currency-exchange-rates-understanding-equilibrium-value
- Davis, S., & Sagnanert, P. (2024). *Impact of inflation shocks on foreign exchange rates reflects central bank stature*. Federal Reserve Bank of Dallas. https://www.dallasfed.org/research/economics/2024/0903
- Du, W., Tepper, A., & Verdelhan, A. (2018). Deviations from covered interest rate parity. *The Journal of Finance, 73*(3), 915–957. https://doi.org/10.1111/jofi.12620
- Gavin, W. T., & Cooke, D. A. (2014). *The ups and downs of inflation and the role of Fed credibility*. Federal Reserve Bank of St. Louis. https://www.stlouisfed.org/publications/regional-economist/april-2014/the-ups-and-downs-of-inflation-and-the-role-of-fed-credibility
- Madura, J., & Zipfel, C. (2026). *International financial management* (15th ed.). Cengage. https://www.cengageasia.com/title/default/detail?isbn=9798214040684
- Universiti Teknologi PETRONAS, Department of Management. (2026). *FinBridge AI innovation challenge: Group project assignment — International financial management* [Course brief].

Third-party software: React, Vite, TypeScript, Tailwind CSS, KaTeX, Vitest, Testing Library, ESLint (all open source;
see `app/package.json` for versions and each package's licence in `app/node_modules`).

## Group information

| Item | Details |
|---|---|
| Group number | **Group 06** |
| Programme | Bachelor of Computer Science (Hons) |
| Suggested submission files | `Group06_FinBridgeAI_Poster.pdf` · `Group06_FinBridgeAI_Video.mp4` |
| Member 1 | Ariff Bin Azemi (22004594) |
| Member 2 | Muhammad Haikal bin Man Ghazali (22002780) |
| Member 3 | Nur Nafiesa Binti Nor Haizon (22005608) |
| Member 4 | Nursyasya Batrisyia Binti Zulkiflee (22003205) |

The team list and the disclosure below are also shown on the app's References and About page
(`app/src/content/about.ts`).

### AI-use disclosure

> Generative AI tools were used in this project. Claude Code was used to write the ParityLab web application, its
> automated tests, the independent Python verification script and the project documentation. All formulas, scenarios
> and reference values come from the group’s project report and the course materials. All rates are hypothetical
> teaching values. The group takes full responsibility for all submitted work. No personal or private data was given
> to any AI tool.
