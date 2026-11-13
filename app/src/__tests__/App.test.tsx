import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { approxVerdict, DISCLAIMER, SPIKE_CALLOUT } from '../lib/interpretation';
import { calculate } from '../lib/finance';
import { formatSpotUnit } from '../lib/format';
import { PRESETS } from '../lib/scenarios';
import { QUIZ } from '../content/quiz';
import { TOPICS } from '../content/topics';

function renderAt(route: string) {
  window.location.hash = `#/${route}`;
  return render(<App />);
}

function card(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function mainNav() {
  return screen.getByRole('navigation', { name: 'Main' });
}

const SCREENS = ['Home', 'Simulator', 'Compare', 'Quiz', 'Learn More'];

describe('T10 disclosure on every screen', () => {
  it('shows the disclaimer on all five screens', async () => {
    const user = userEvent.setup();
    renderAt('home');
    for (const name of SCREENS) {
      await user.click(within(mainNav()).getByRole('link', { name }));
      expect(within(mainNav()).getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('disclaimer')).toHaveTextContent(DISCLAIMER);
    }
  });

  it('keeps the approved short labels on the Simulator and the long forms one step away', () => {
    renderAt('simulator');
    expect(screen.getByRole('heading', { name: 'Your assumptions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PPP future rate' })).toBeInTheDocument();
    expect(within(card('card-ppp')).getByText('model scenario')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Forward rate (theoretical)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Malaysia nominal rate (Fisher)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'US nominal rate (Fisher)' })).toBeInTheDocument();
    expect(screen.getByText("Today's rate", { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('hypothetical')).toBeInTheDocument();
    // Long forms live in the ⓘ tooltips (and on Learn More).
    expect(screen.getByText(/Spot rate \(hypothetical, not a live quote\)/)).toBeInTheDocument();
    expect(screen.getByText(/PPP-implied future spot \(model scenario, long-run benchmark\)/)).toBeInTheDocument();
    expect(screen.getByText(/Expected inflation assumption/)).toBeInTheDocument();
  });
});

describe('Simulator — baseline and presets (QA checklist)', () => {
  it('loads the baseline by default with the exact reference values', () => {
    renderAt('simulator');
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.3786$/);
    expect(screen.getByTestId('cip-value')).toHaveTextContent(/^4\.3786$/);
    expect(within(card('card-fisher-my')).getByText('4.0375%')).toBeInTheDocument();
    expect(within(card('card-fisher-us')).getByText('4.5450%')).toBeInTheDocument();
    // Visible values are spans/strong; the duplicate cells belong to the screen-reader data tables.
    expect(within(screen.getByTestId('flow-diagram')).getByText('−0.5075 pp', { selector: 'span' })).toBeInTheDocument();
    const hero = card('card-ppp');
    // Each percentage carries its own words; the badge's arrow is labelled as the MYR/USD move.
    const detail = within(hero).getByTestId('direction-detail');
    expect(detail).toHaveTextContent('MYR/USD falls 0.4854%');
    expect(detail).toHaveTextContent('RM 1 buys 0.4878% more US dollars');
    expect(hero.querySelector('[data-direction]')).toHaveTextContent(/^MYR\/USD falls:\s*Ringgit stronger/);
    expect(hero).toHaveTextContent('In one year: US$1 = RM 4.3786');
    expect(hero.querySelector('[data-direction]')).toHaveAttribute('data-direction', 'appreciates');
    expect(hero.querySelector('[data-direction]')).toHaveTextContent(/Ringgit stronger/);
    expect(screen.getByTestId('parity-sign')).toHaveAttribute('data-equal', 'true');
    expect(screen.getByTestId('parity-chip')).toHaveTextContent('Same as PPP: why?');
    expect(screen.getByText('US inflation is higher, so the model expects a stronger ringgit.')).toBeInTheDocument();
    expect(screen.queryByText(SPIKE_CALLOUT)).toBeNull();
    expect(screen.getByRole('button', { name: /Baseline/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('the "US inflation spike" chip loads Scenario B: 6.5750%, 4.2952 MYR/USD, MYR/USD falls 2.3810%, RM 1 buys 2.4390% more and the callout', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: /US inflation spike/ }));
    expect(screen.getByRole('button', { name: /US inflation spike/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('US inflation')).toHaveValue('5');
    expect(within(card('card-fisher-us')).getByText('6.5750%')).toBeInTheDocument();
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.2952$/);
    expect(screen.getByTestId('cip-value')).toHaveTextContent(/^4\.2952$/);
    const detail = within(card('card-ppp')).getByTestId('direction-detail');
    expect(detail).toHaveTextContent('MYR/USD falls 2.3810%');
    expect(detail).toHaveTextContent('RM 1 buys 2.4390% more US dollars');
    expect(screen.getByText(SPIKE_CALLOUT)).toBeInTheDocument();
  });

  it('chips load cases C–F (D: ringgit weaker, see-saw RM side down; C: level)', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: /Malaysia higher/ }));
    expect(screen.getByLabelText('Malaysia inflation')).toHaveValue('5');
    expect(screen.getByLabelText('US inflation')).toHaveValue('2.5');
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.5073$/);
    expect(card('card-ppp').querySelector('[data-direction]')).toHaveTextContent(/Ringgit weaker/);
    expect(screen.getByTestId('seesaw')).toHaveAttribute('data-rm-side', 'down');
    await user.click(screen.getByRole('button', { name: /^Equal inflation$/ }));
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.4000$/);
    expect(screen.getByTestId('seesaw')).toHaveAttribute('data-rm-side', 'level');
    await user.click(screen.getByRole('button', { name: /Malaysia much higher/ }));
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.7050$/);
    await user.click(screen.getByRole('button', { name: /US much higher/ }));
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.1148$/);
  });

  it('the see-saw tilt direction matches the result direction', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const seesaw = () => screen.getByTestId('seesaw');
    expect(seesaw()).toHaveAttribute('data-rm-side', 'up');
    expect(Number(seesaw().getAttribute('data-angle'))).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Malaysia much higher/ }));
    expect(seesaw()).toHaveAttribute('data-rm-side', 'down');
    expect(Number(seesaw().getAttribute('data-angle'))).toBe(-15);
    await user.click(screen.getByRole('button', { name: /^Equal inflation$/ }));
    expect(Number(seesaw().getAttribute('data-angle'))).toBe(0);
  });

  it('advanced mode (More options) shows PPP 4.3786 vs forward 4.3359 and "≠" in the flow diagram', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: 'More options' }));
    await user.click(screen.getByRole('button', { name: 'Load example: unequal real rates' }));
    expect(screen.getByRole('switch', { name: /Separate real rates/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('US real rate')).toHaveValue('2.5');
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.3786$/);
    expect(screen.getByTestId('cip-value')).toHaveTextContent(/^4\.3359$/);
    const sign = screen.getByTestId('parity-sign');
    expect(sign).toHaveAttribute('data-equal', 'false');
    expect(sign).toHaveTextContent('does not equal');
    expect(sign).toHaveTextContent('0.0427');
    expect(screen.getByTestId('parity-chip')).toHaveTextContent('Differs by 0.0427: why?');
    await user.click(within(card('card-cip')).getByRole('button', { name: /Show the math/ }));
    const dialog = screen.getByRole('dialog', { name: 'Forward rate (theoretical)' });
    expect(
      within(dialog).getByText(/PPP and the covered forward differ because assumed real rates are unequal/),
    ).toBeInTheDocument();
  });

  it('the switch turns advanced mode on and off without losing the common rate', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: 'More options' }));
    await user.click(screen.getByRole('switch', { name: /Separate real rates/ }));
    expect(screen.getByLabelText('Malaysia real rate')).toHaveValue('1.5');
    expect(screen.getByTestId('parity-sign')).toHaveAttribute('data-equal', 'true');
    await user.click(screen.getByRole('switch', { name: /Separate real rates/ }));
    expect(screen.getByLabelText('Real interest rate')).toHaveValue('1.5');
  });

  it('Reset restores the baseline', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: /US inflation spike/ }));
    await user.click(screen.getByRole('button', { name: 'Reset to baseline' }));
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.3786$/);
    expect(screen.getByRole('button', { name: /Baseline/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Slider ↔ numeric sync', () => {
  it('moving the slider updates the numeric field and the results', () => {
    renderAt('simulator');
    fireEvent.change(screen.getByRole('slider', { name: 'US inflation slider' }), { target: { value: '5' } });
    expect(screen.getByLabelText('US inflation')).toHaveValue('5');
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.2952$/);
  });

  it('typing in the numeric field moves the slider, keeping finer precision', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const input = screen.getByLabelText('Malaysia inflation');
    await user.clear(input);
    await user.type(input, '4.25');
    expect(screen.getByRole('slider', { name: 'Malaysia inflation slider' })).toHaveValue('4.25');
    expect(input).toHaveValue('4.25');
    expect(screen.getByRole('button', { name: /Baseline/ })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Invalid input never shows stale results', () => {
  it('"abc" hides every result', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const input = screen.getByLabelText('Malaysia inflation');
    await user.clear(input);
    await user.type(input, 'abc');
    expect(screen.getByTestId('results-hidden')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Not a number/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('card-ppp')).toBeNull();
    expect(screen.queryByTestId('ppp-value')).toBeNull();
    expect(screen.queryByTestId('flow-diagram')).toBeNull();
    expect(screen.queryByText('4.0375%')).toBeNull();
    expect(screen.queryByText(/4\.3786/)).toBeNull();
    expect(screen.getByRole('button', { name: /Send to Compare/ })).toBeDisabled();
  });

  it('spot = 0 and out-of-range values are rejected', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const spot = screen.getByLabelText(/Today's rate/);
    await user.clear(spot);
    await user.type(spot, '0');
    expect(screen.getByText('Spot rate must be greater than 0 MYR/USD.')).toBeInTheDocument();
    expect(screen.getByTestId('results-hidden')).toBeInTheDocument();
    await user.clear(spot);
    await user.type(spot, '4.4');
    expect(screen.queryByTestId('results-hidden')).toBeNull();
    const us = screen.getByLabelText('US inflation');
    await user.clear(us);
    await user.type(us, '20');
    expect(screen.getByText('Enter a value between −5% and 15%.')).toBeInTheDocument();
    expect(document.getElementById('card-ppp')).toBeNull();
  });
});

describe('"Show the math" drawers', () => {
  it('the PPP drawer shows the KaTeX trace, the approximation verdict and closes with Esc', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const trigger = within(card('card-ppp')).getByRole('button', { name: /Show the math/ });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'PPP future rate' });
    expect(within(dialog).getByText(/General formula \(relative PPP\)/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Substitute/).length).toBeGreaterThan(0);
    expect(dialog.querySelectorAll('.katex').length).toBeGreaterThan(0);
    expect(within(dialog).getByText(approxVerdict(calculate(PRESETS.A.inputs)))).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Learn more about Purchasing Power Parity/ })).toHaveAttribute(
      'href',
      '#/learn/ppp',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('flow-diagram nodes open their own drawer', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(within(screen.getByTestId('flow-diagram')).getByRole('button', { name: /Nominal rates/ }));
    const dialog = screen.getByRole('dialog', { name: 'Nominal interest rates' });
    expect(within(dialog).getByRole('heading', { name: 'Malaysia' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Nominal differential' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Learn more links on every main card', () => {
  it('route to the matching Learn More topic', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const links: [HTMLElement, RegExp, string][] = [
      [card('card-ppp'), /Learn more about Purchasing Power Parity/, '#/learn/ppp'],
      [card('card-cip'), /Equals the PPP rate here — why\?/, '#/learn/forward-equals-ppp'],
      [screen.getByTestId('summary'), /see what it can't tell you/, '#/learn/limitations'],
    ];
    for (const [scope, name, href] of links) {
      expect(within(scope).getByRole('link', { name })).toHaveAttribute('href', href);
    }
    // The metric cards keep one action; their topic link lives in the "Show the math" drawer's footer.
    expect(within(card('card-cip')).queryByRole('link', { name: /Learn more/ })).toBeNull();
    await user.click(within(card('card-cip')).getByRole('button', { name: /Show the math/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: /Learn more/ }));
    expect(window.location.hash).toBe('#/learn/covered-irp');
    expect(within(mainNav()).getByRole('link', { name: 'Learn More' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('Hash routes and the Back button', () => {
  it('every screen has its own hash, and Back returns to the previous screen', async () => {
    const user = userEvent.setup();
    renderAt('home');
    await user.click(within(mainNav()).getByRole('link', { name: 'Simulator' }));
    expect(window.location.hash).toBe('#/simulator');
    await user.click(within(mainNav()).getByRole('link', { name: 'Quiz' }));
    expect(window.location.hash).toBe('#/quiz');
    window.history.back();
    await waitFor(() =>
      expect(within(mainNav()).getByRole('link', { name: 'Simulator' })).toHaveAttribute('aria-current', 'page'),
    );
    expect(screen.getByTestId('ppp-value')).toBeInTheDocument();
  });

  it('v1 links still work (#/welcome → Home, #/methodology → Learn More)', () => {
    renderAt('methodology');
    expect(within(mainNav()).getByRole('link', { name: 'Learn More' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('Guided lesson', () => {
  it('walks five steps and asks for a prediction before revealing Scenario B', async () => {
    const user = userEvent.setup();
    renderAt('home');
    await user.click(screen.getByRole('button', { name: /Start guided lesson/ }));
    const lesson = screen.getByRole('complementary', { name: 'Guided lesson' });
    expect(within(lesson).getByText('Guided lesson · Step 1 of 5')).toBeInTheDocument();
    expect(document.getElementById('sim-field-spot')).toHaveClass('highlight-ring');
    for (let k = 0; k < 4; k += 1) await user.click(within(lesson).getByRole('button', { name: 'Next' }));
    expect(within(lesson).getByText('Predict before you look')).toBeInTheDocument();
    // The baseline is still showing before the prediction.
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.3786$/);
    await user.click(within(lesson).getByRole('button', { name: /MYR\/USD will fall/ }));
    expect(within(lesson).getByText(/Correct — you predicted a fall/)).toBeInTheDocument();
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.2952$/);
    await user.click(within(lesson).getByRole('button', { name: 'Finish lesson' }));
    expect(screen.queryByRole('complementary', { name: 'Guided lesson' })).toBeNull();
  });
});

describe('Compare screen', () => {
  it('Send to Compare carries the simulator inputs into Scenario B', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: /Malaysia much higher/ }));
    await user.click(screen.getByRole('button', { name: /Send to Compare/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Compare scenarios' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Scenario B/ })).toHaveTextContent('From the simulator');
    const table = screen.getByRole('table', { name: /key results/ });
    expect(within(table).getByText('4.7050 MYR/USD')).toBeInTheDocument();
  });

  it('shows A vs B in a 4-row table with the chart axis label, and the full v1 table on demand', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    expect(screen.getAllByText('MYR per USD — lower = MYR stronger').length).toBeGreaterThanOrEqual(2);
    const simple = screen.getByRole('table', { name: /key results/ });
    expect(within(simple).getAllByRole('row')).toHaveLength(5);
    expect(within(simple).getByText('4.2952 MYR/USD')).toBeInTheDocument();
    expect(within(simple).getByText('+2.0300 pp')).toBeInTheDocument();
    expect(within(simple).getByText('−0.0834 MYR/USD')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all rows' }));
    const full = screen.getByRole('table', { name: /assumptions and outputs/ });
    expect(within(full).getAllByText('4.2952 MYR/USD')).toHaveLength(3);
    expect(within(full).getAllByText('−0.0834 MYR/USD')).toHaveLength(3);
    expect(within(full).getByText('+2.0300 pp')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
  });

  it('the "Six scenarios" tab computes cases A–F live', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    await user.click(screen.getByRole('tab', { name: 'Six scenarios' }));
    expect(screen.getByRole('tab', { name: 'Six scenarios' })).toHaveAttribute('aria-selected', 'true');
    const sens = screen.getByRole('table', { name: 'Sensitivity cases A to F' });
    for (const v of ['4.3786', '4.2952', '4.4000', '4.5073', '4.7050', '4.1148']) {
      expect(within(sens).getAllByText(`${v} MYR/USD`)).toHaveLength(2);
    }
    // E's MYR value change and F's quote change are both −6.4815%.
    expect(within(sens).getAllByText('−6.4815%')).toHaveLength(2);
    expect(within(sens).getAllByText('+6.9307%')).toHaveLength(2);
    expect(
      screen.getByText('Each row is a separate one-year scenario from the same spot rate, not a time series.'),
    ).toBeInTheDocument();
  });

  it('dragging the curve point with the keyboard changes Scenario B', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    const point = () => screen.getByRole('slider', { name: 'US inflation on the curve' });
    expect(point()).toHaveAttribute('aria-valuenow', '5');
    point().focus();
    await user.keyboard('{ArrowRight}');
    expect(point()).toHaveAttribute('aria-valuenow', '5.1');
    const simple = () => screen.getByRole('table', { name: /key results/ });
    const at = (us: number) => formatSpotUnit(calculate({ ...PRESETS.B.inputs, usInflationPct: us }).pppSpot);
    expect(within(simple()).getByText(at(5.1))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Scenario B/ })).toHaveTextContent('Custom');
    await user.keyboard('{PageDown}');
    expect(point()).toHaveAttribute('aria-valuenow', '4.1');
    expect(within(simple()).getByText(at(4.1))).toBeInTheDocument();
  });

  it('the heatmap loads the selected cell into Scenario B (keyboard)', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    await user.click(screen.getByRole('tab', { name: 'Heatmap' }));
    screen.getByTestId('heatmap').focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText(/Malaysia 3\.00%, US 6\.00%: MYR\/USD/)).toBeInTheDocument();
    await user.keyboard('{Enter}');
    const expected = formatSpotUnit(calculate({ ...PRESETS.B.inputs, myInflationPct: 3, usInflationPct: 6 }).pppSpot);
    expect(within(screen.getByRole('table', { name: /key results/ })).getByText(expected)).toBeInTheDocument();
  });

  it('shows Scenario A as the locked baseline above Scenario B, unchanged when B changes', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    const a = screen.getByTestId('scenario-a');
    expect(within(a).getByRole('heading', { name: 'Scenario A Baseline (locked)' })).toBeInTheDocument();
    const text = () => within(a).getAllByRole('definition').map((d) => d.textContent);
    expect(text()).toEqual(['2.50%', '3.00%', '1.50%', 'US$1 = RM 4.4000']);
    expect(within(a).queryByRole('button')).toBeNull();
    expect(within(a).queryByRole('textbox')).toBeNull();
    const b = screen.getByRole('heading', { name: /Scenario B/ }).closest('section')!;
    expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Malaysia much higher/ }));
    expect(text()).toEqual(['2.50%', '3.00%', '1.50%', 'US$1 = RM 4.4000']);
  });

  it('invalid Scenario B input hides the comparison', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    await user.click(screen.getByRole('button', { name: 'Edit numbers' }));
    const us = screen.getByLabelText('US inflation');
    await user.clear(us);
    await user.type(us, 'abc');
    expect(screen.getByTestId('results-hidden')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: /key results/ })).toBeNull();
    expect(screen.queryByText(/4\.2952/)).toBeNull();
  });
});

describe('Quiz', () => {
  it('gives feedback only after answering, links to the topic, then reviews every answer without a celebration', async () => {
    const user = userEvent.setup();
    renderAt('quiz');
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    expect(screen.queryByTestId('quiz-feedback')).toBeNull();
    expect(screen.queryByText(/Not quite/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /It rises: the ringgit depreciates/ }));
    const feedback = screen.getByTestId('quiz-feedback');
    expect(feedback).toHaveTextContent('Not quite. The answer is: It falls: the ringgit appreciates.');
    expect(within(feedback).getByRole('link', { name: /Learn more about Purchasing Power Parity/ })).toHaveAttribute('href', '#/learn/ppp');
    await user.click(within(feedback).getByRole('button', { name: 'Show calculation' }));
    // The calculation line typesets π_US with a real subscript, so match the whole list item's text.
    const calcLine = within(feedback).getByText(
      (_, el) => el?.tagName === 'LI' && /πUS raised to 5\.00%: 4\.4 × 1\.025\/1\.05 = 4\.2952 MYR\/USD/.test(el.textContent ?? ''),
    );
    expect(calcLine.querySelector('sub')).toHaveTextContent('US');
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    for (const item of QUIZ.slice(1)) {
      await user.click(screen.getByRole('button', { name: /Next question/ }));
      expect(screen.queryByTestId('quiz-feedback')).toBeNull();
      const right = item.options.find((o) => o.id === item.correct)!.text;
      await user.click(screen.getByRole('button', { name: (name) => name.includes(right) }));
      expect(screen.getByTestId('quiz-feedback')).toHaveTextContent('Correct.');
    }
    await user.click(screen.getByRole('button', { name: /See your score/ }));
    const done = screen.getByTestId('quiz-done');
    expect(done).toHaveTextContent('You scored 4 out of 5');
    // No celebration tropes; instead every question is reviewed, with the miss linked to its topic.
    expect(done.querySelector('.confetti')).toBeNull();
    const review = within(done).getByRole('list', { name: 'Your answers' });
    expect(within(review).getAllByRole('listitem')).toHaveLength(5);
    expect(review).toHaveTextContent('Correct answer: It falls: the ringgit appreciates');
    expect(within(review).getByRole('link', { name: /Learn more about Purchasing Power Parity/ })).toHaveAttribute('href', '#/learn/ppp');
    // Retry only the missed question, then return to the score.
    await user.click(within(done).getByRole('button', { name: /Retry missed questions/ }));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /It falls: the ringgit appreciates/ }));
    await user.click(screen.getByRole('button', { name: /See your score/ }));
    expect(screen.getByTestId('quiz-done')).toHaveTextContent('You scored 5 out of 5');
    await user.click(screen.getByRole('button', { name: /Start again/ }));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });
});

describe('Learn More', () => {
  it('the hub lists 12 topics as a numbered reading path in three groups, starting with Reading exchange rates', () => {
    renderAt('learn');
    for (const name of ['Basics', 'The theories', 'Going deeper']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    for (const t of TOPICS) {
      const link = screen.getByRole('link', { name: new RegExp(t.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
      expect(link).toHaveAttribute('href', `#/learn/${t.id}`);
      expect(link).not.toHaveTextContent(/min read/);
    }
    expect(screen.getByRole('link', { name: /Reading exchange rates/ })).toHaveTextContent('Start here');
  });

  it('every topic page uses the template and keeps the disclaimer', () => {
    for (const t of TOPICS) {
      const { unmount } = renderAt(`learn/${t.id}`);
      expect(screen.getByRole('heading', { level: 1, name: t.title })).toBeInTheDocument();
      expect(screen.getByTestId('disclaimer')).toHaveTextContent(DISCLAIMER);
      expect(screen.getByRole('heading', { name: 'In more detail' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Key assumptions' })).toBeInTheDocument();
      if (t.id !== 'about') expect(screen.getByRole('heading', { name: 'With your current numbers' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to simulator' })).toHaveAttribute('href', '#/simulator');
      const topicNav = screen.getByRole('navigation', { name: 'Topic navigation' });
      expect(within(topicNav).getAllByRole('link').length).toBeGreaterThanOrEqual(1);
      unmount();
      window.location.hash = '';
    }
  });

  it('a card link from the Simulator lands on the topic, and Back returns', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(within(card('card-ppp')).getByRole('link', { name: /Learn more about Purchasing Power Parity/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Purchasing Power Parity' })).toBeInTheDocument();
    window.history.back();
    await waitFor(() => expect(screen.getByTestId('ppp-value')).toBeInTheDocument());
  });

  it('PPP: the shopping basket implies the PPP rate with live numbers', async () => {
    const user = userEvent.setup();
    renderAt('learn/ppp');
    expect(screen.getByTestId('basket-rate')).toHaveTextContent('4.4000 MYR/USD');
    await user.click(screen.getByRole('button', { name: /Play one year/ }));
    expect(screen.getByTestId('basket-rm')).toHaveTextContent('RM 4.5100');
    expect(screen.getByTestId('basket-usd')).toHaveTextContent('US$1.0300');
    expect(screen.getByTestId('basket-rate')).toHaveTextContent('4.3786 MYR/USD');
  });

  it('Covered IRP: both routes end with the same ringgit amount after five steps', async () => {
    const user = userEvent.setup();
    renderAt('learn/covered-irp');
    expect(screen.getByTestId('route-home')).toHaveTextContent('?');
    for (let k = 0; k < 5; k += 1) await user.click(screen.getByRole('button', { name: /Next step/ }));
    expect(screen.getByTestId('route-home')).toHaveTextContent('RM 1.040375');
    expect(screen.getByTestId('route-abroad')).toHaveTextContent('RM 1.040375');
    expect(screen.getByText(/no arbitrage\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next step/ })).toBeDisabled();
  });

  it('Why the forward equals PPP: the common (1 + r) cancels', async () => {
    const user = userEvent.setup();
    renderAt('learn/forward-equals-ppp');
    await user.click(screen.getByRole('button', { name: 'Cancel the common term' }));
    expect(screen.getByTestId('cancel-result')).toHaveTextContent('forward = PPP future rate = 4.3786 MYR/USD');
  });

  it('the advanced lab shows PPP 4.3786 vs forward 4.3359 and opens in the simulator', async () => {
    const user = userEvent.setup();
    renderAt('learn/advanced-lab');
    expect(screen.getByTestId('lab-ppp')).toHaveTextContent('4.3786');
    expect(screen.getByTestId('lab-cip')).toHaveTextContent('4.3359');
    expect(screen.getByTestId('lab-sign')).toHaveTextContent('differs by 0.0427');
    expect(screen.getByText('0.9902439024', { selector: 'strong' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open in simulator/ }));
    expect(screen.getByTestId('cip-value')).toHaveTextContent(/^4\.3359$/);
    expect(screen.getByTestId('parity-sign')).toHaveAttribute('data-equal', 'false');
  });

  it('the glossary can be filtered', async () => {
    const user = userEvent.setup();
    renderAt('learn/glossary');
    expect(screen.getByText('Spot rate (S₀)')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Filter terms'), 'forward');
    expect(screen.getByText('Forward rate (F)')).toBeInTheDocument();
    expect(screen.queryByText('Spot rate (S₀)')).toBeNull();
  });

  it('live numbers disappear (no stale values) when the simulator inputs are invalid', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const input = screen.getByLabelText('Malaysia inflation');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.click(within(mainNav()).getByRole('link', { name: 'Learn More' }));
    await user.click(screen.getByRole('link', { name: /Purchasing Power Parity/ }));
    expect(screen.getByText(/Your simulator inputs are not valid right now/)).toBeInTheDocument();
  });
});

describe('Learn more links on Home and Compare', () => {
  it('the Home step cards and the Compare cards deep-link to their topics', () => {
    const { unmount } = renderAt('home');
    const steps = screen.getByRole('list', { name: 'How ParityLab works' });
    expect(within(steps).getByRole('link', { name: /Change inflation/ })).toHaveAttribute('href', '#/simulator');
    expect(within(steps).getByRole('link', { name: /Interest rates react/ })).toHaveAttribute('href', '#/learn/fisher');
    expect(within(steps).getByRole('link', { name: /Ringgit moves/ })).toHaveAttribute('href', '#/learn/ppp');
    unmount();
    renderAt('compare');
    expect(screen.getByRole('link', { name: /Learn more about reading exchange rates/ })).toHaveAttribute(
      'href',
      '#/learn/reading-rates',
    );
    expect(screen.getByRole('link', { name: /Learn more about comparing scenarios/ })).toHaveAttribute(
      'href',
      '#/learn/six-scenarios',
    );
    expect(screen.getByRole('link', { name: /Learn more about Purchasing Power Parity/ })).toHaveAttribute('href', '#/learn/ppp');
  });
});

describe('Group number', () => {
  it('reads "Group 06" in the footer and on References and About', () => {
    renderAt('learn/about');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Group 06');
    expect(screen.getByText('Group 06', { selector: 'dd' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Group XX/);
  });

  it('lists the team members, programme and AI-use disclosure with no placeholders left', () => {
    renderAt('learn/about');
    expect(screen.getByText('Ariff Bin Azemi (22004594)')).toBeInTheDocument();
    expect(screen.getByText('Muhammad Haikal bin Man Ghazali (22002780)')).toBeInTheDocument();
    expect(screen.getByText('Nur Nafiesa Binti Nor Haizon (22005608)')).toBeInTheDocument();
    expect(screen.getByText('Nursyasya Batrisyia Binti Zulkiflee (22003205)')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Computer Science (Hons)', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText(/^Generative AI tools were used in this project\. Claude Code was used/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/to be completed|To be written/);
  });
});

describe('Layout stability (structure checks in jsdom)', () => {
  const chipsIn = (group: string) => within(screen.getByRole('group', { name: group })).getAllByRole('button');

  it('preset chips carry no icon; selection is exposed through aria-pressed', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const check = () => {
      const chips = chipsIn('Scenario presets');
      expect(chips).toHaveLength(6);
      for (const c of chips) expect(c.querySelector('svg')).toBeNull();
      return chips.map((c) => c.getAttribute('aria-pressed'));
    };
    expect(check()).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
    await user.click(screen.getByRole('button', { name: /US inflation spike/ }));
    expect(check()).toEqual(['false', 'true', 'false', 'false', 'false', 'false']);
  });

  it('Compare chips carry no icon and the changing Scenario B tag sits outside the chip row', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    const row = screen.getByRole('group', { name: 'Scenario B presets' });
    for (const c of within(row).getAllByRole('button')) expect(c.querySelector('svg')).toBeNull();
    expect(row.parentElement).not.toHaveTextContent('Scenario B');
    await user.click(within(row).getByRole('button', { name: /Malaysia much higher/ }));
    expect(screen.getByRole('heading', { name: /Scenario B/ })).toHaveTextContent('Extreme Malaysian divergence');
  });

  it('toggle buttons keep the same accessible name when opened and closed', async () => {
    const user = userEvent.setup();
    renderAt('compare');
    for (const name of ['Show all rows', 'Edit numbers', 'Show values as a table']) {
      const button = screen.getByRole('button', { name });
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAccessibleName(name);
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    await user.click(screen.getByRole('tab', { name: 'Heatmap' }));
    const heat = screen.getByRole('button', { name: 'Show heatmap values as a table' });
    await user.click(heat);
    expect(heat).toHaveAccessibleName('Show heatmap values as a table');
  });

  it('the Simulator "More options" toggle and the quiz "Show calculation" toggle keep their names', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt('simulator');
    const more = screen.getByRole('button', { name: 'More options' });
    await user.click(more);
    expect(more).toHaveAccessibleName('More options');
    unmount();
    renderAt('quiz');
    await user.click(screen.getByRole('button', { name: /It falls: the ringgit appreciates/ }));
    const calc = screen.getByRole('button', { name: 'Show calculation' });
    await user.click(calc);
    expect(calc).toHaveAccessibleName('Show calculation');
    expect(calc).toHaveAttribute('aria-expanded', 'true');
  });

  it('two-state buttons reserve both labels (basket, cancellation)', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt('learn/ppp');
    const play = screen.getByRole('button', { name: 'Play one year' });
    expect(play).toHaveTextContent(/Play one year.*Back to today/);
    await user.click(play);
    expect(play).toHaveAccessibleName('Back to today');
    unmount();
    renderAt('learn/forward-equals-ppp');
    const cancel = screen.getByRole('button', { name: 'Cancel the common term' });
    expect(cancel).toHaveTextContent(/Cancel the common term.*Undo/);
  });

  it('quiz answers keep a status slot in every state', async () => {
    const user = userEvent.setup();
    renderAt('quiz');
    const answers = within(screen.getByRole('group', { name: /US expected inflation rises/ })).getAllByRole('button');
    const slots = () => answers.map((a) => a.lastElementChild?.className ?? '');
    expect(slots().every((c) => c.includes('w-32'))).toBe(true);
    await user.click(answers[0]);
    expect(slots().every((c) => c.includes('w-32'))).toBe(true);
  });

  it('advanced mode keeps the common real-rate slot (hidden) and adds country rates below the switch', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    await user.click(screen.getByRole('button', { name: 'More options' }));
    const sw = screen.getByRole('switch', { name: /Separate real rates/ });
    await user.click(sw);
    expect(document.getElementById('sim-field-realRate')).not.toBeNull();
    const mine = screen.getByLabelText('Malaysia real rate');
    // DOCUMENT_POSITION_FOLLOWING: the country field comes after the switch.
    expect(sw.compareDocumentPosition(mine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Direction clarity and screen-reader announcements', () => {
  it('announces the settled result politely, and hides numbers at once when an input is invalid', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const live = screen.getByTestId('result-announcer');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('PPP future rate 4.3786 MYR/USD. Ringgit stronger: MYR/USD falls 0.4854%');
    await user.click(screen.getByRole('button', { name: /US inflation spike/ }));
    await waitFor(() => expect(live).toHaveTextContent('PPP future rate 4.2952 MYR/USD'), { timeout: 2000 });
    const input = screen.getByLabelText('Malaysia inflation');
    await user.clear(input);
    await user.type(input, 'abc');
    expect(live).toHaveTextContent('Results hidden until the highlighted inputs are fixed.');
    expect(live).not.toHaveTextContent(/\d\.\d{4}/);
  });

  it('Compare says in words which way B moved the ringgit relative to A', () => {
    renderAt('compare');
    expect(screen.getByTestId('relative-direction')).toHaveTextContent('MYR/USD ↓, stronger in B');
    expect(screen.getByRole('rowheader', { name: 'Malaysia nominal rate (Fisher)' })).toBeInTheDocument();
  });

  it('the invalid-state card offers a reset that restores the baseline', async () => {
    const user = userEvent.setup();
    renderAt('simulator');
    const input = screen.getByLabelText('Malaysia inflation');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.click(within(screen.getByTestId('results-hidden')).getByRole('button', { name: /Reset to baseline/ }));
    expect(screen.getByTestId('ppp-value')).toHaveTextContent(/^4\.3786$/);
  });
});
