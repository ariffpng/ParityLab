import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { calculate } from '../finance';
import { PRESETS } from '../scenarios';
import {
  approxTrace,
  cipTrace,
  differentialTrace,
  fisherTrace,
  ifeTrace,
  inflationGapTrace,
  parityTrace,
  pppTrace,
} from '../traces';

const builders = [
  (r: ReturnType<typeof calculate>) => fisherTrace(r, 'MY'),
  (r: ReturnType<typeof calculate>) => fisherTrace(r, 'US'),
  differentialTrace,
  inflationGapTrace,
  pppTrace,
  cipTrace,
  ifeTrace,
  approxTrace,
  parityTrace,
];

describe('formula traces', () => {
  for (const preset of Object.values(PRESETS)) {
    it(`every trace for preset ${preset.id} is valid, ASCII-only KaTeX`, () => {
      const r = calculate(preset.inputs);
      for (const build of builders) {
        for (const step of build(r).steps) {
          expect(step.tex).toMatch(/^[\x20-\x7e]*$/);
          expect(() => katex.renderToString(step.tex, { throwOnError: true, strict: 'error' })).not.toThrow();
        }
      }
    });
  }

  it('baseline PPP trace shows general formula → substitution → result', () => {
    const steps = pppTrace(calculate(PRESETS.A.inputs)).steps;
    expect(steps[0].tex).toContain('\\frac{1 + \\pi_{MY}}{1 + \\pi_{US}}');
    expect(steps[1].tex).toContain('\\frac{1.025}{1.03}');
    expect(steps[1].tex).toContain('0.9951456311');
    expect(steps[2].tex).toContain('4.3786407767 \\approx 4.3786');
  });

  it('Fisher trace shows the exact and approximate rates', () => {
    const steps = fisherTrace(calculate(PRESETS.A.inputs), 'MY').steps;
    expect(steps[1].tex).toContain('1.015 \\times 1.025 - 1 = 1.040375 - 1');
    expect(steps[2].tex).toContain('4.0375\\%');
    expect(steps[3].tex).toContain('4.0000\\%');
  });

  it('advanced parity trace shows the real-rate ratio', () => {
    const steps = parityTrace(calculate(PRESETS.ADV.inputs)).steps;
    expect(steps[1].tex).toContain('\\frac{1.015}{1.025} = 0.9902439024');
  });
});

describe('inflation gap trace (v2 drawer)', () => {
  it('baseline gap is −0.5000 pp (Malaysia minus US)', () => {
    const steps = inflationGapTrace(calculate(PRESETS.A.inputs)).steps;
    expect(steps[1].tex).toContain('(0.025 - 0.03) \\times 100');
    expect(steps[2].tex).toContain('-0.5000');
  });
});
