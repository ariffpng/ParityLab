import { describe, expect, it } from 'vitest';
import { calculate as compute } from '../finance';
import { BASELINE, PRESETS } from '../scenarios';
import {
  compareConclusion,
  directionWithQuote,
  quoteArrow,
  quoteMoveSentence,
  relativeDirection,
  relativeDirectionText,
  resultAnnouncement,
  ringgitValueSentence,
} from '../directionCopy';

const a = compute(BASELINE);

describe('directionCopy', () => {
  it('ties the arrow to the MYR/USD quote (↓ = ringgit stronger)', () => {
    expect(quoteArrow('appreciates')).toBe('↓');
    expect(quoteArrow('depreciates')).toBe('↑');
    expect(quoteArrow('unchanged')).toBe('=');
    expect(directionWithQuote('appreciates')).toBe('MYR/USD ↓, ringgit stronger');
    expect(directionWithQuote('depreciates')).toBe('MYR/USD ↑, ringgit weaker');
    expect(directionWithQuote('unchanged')).toBe('MYR/USD =, no change');
  });

  it('gives each baseline percentage its own unsigned words', () => {
    expect(ringgitValueSentence(a)).toBe('RM 1 buys 0.4878% more US dollars');
    expect(quoteMoveSentence(a)).toBe('MYR/USD falls 0.4854%');
  });

  it('describes a weaker ringgit and no change', () => {
    const weaker = { myrDirection: 'depreciates' as const, myrValueChangePct: -1.5, quoteChangePct: 1.5228 };
    expect(ringgitValueSentence(weaker)).toBe('RM 1 buys 1.5000% fewer US dollars');
    expect(quoteMoveSentence(weaker)).toBe('MYR/USD rises 1.5228%');
    const same = { myrDirection: 'unchanged' as const, myrValueChangePct: 0, quoteChangePct: 0 };
    expect(ringgitValueSentence(same)).toBe('RM 1 buys the same US dollars');
    expect(quoteMoveSentence(same)).toBe('MYR/USD unchanged');
  });

  it('builds the screen-reader announcement from display-rounded values', () => {
    expect(resultAnnouncement(a)).toBe(
      'PPP future rate 4.3786 MYR/USD. Ringgit stronger: MYR/USD falls 0.4854%, RM 1 buys 0.4878% more US dollars.',
    );
    expect(resultAnnouncement(a, 'Scenario B')).toMatch(/^Scenario B: PPP future rate 4\.3786 MYR\/USD\./);
  });

  it('compares B with A: the US inflation spike makes the ringgit stronger in B', () => {
    const b = compute(PRESETS.B.inputs);
    expect(relativeDirection(a.pppSpot, b.pppSpot)).toBe('appreciates');
    expect(relativeDirection(b.pppSpot, a.pppSpot)).toBe('depreciates');
    expect(relativeDirection(a.pppSpot, a.pppSpot)).toBe('unchanged');
    expect(relativeDirectionText('appreciates')).toBe('MYR/USD ↓, stronger in B');
    expect(relativeDirectionText('unchanged')).toBe('MYR/USD =, same in both');
  });

  it('states the Compare conclusion in one sentence of at most 20 words', () => {
    const b = compute(PRESETS.B.inputs);
    const d = compute(PRESETS.D.inputs);
    expect(compareConclusion(a.pppSpot, b.pppSpot)).toBe(
      'In Scenario B the ringgit ends stronger than in A: 4.2952 vs 4.3786 MYR/USD in one year.',
    );
    expect(compareConclusion(a.pppSpot, d.pppSpot)).toMatch(/ringgit ends weaker than in A: 4\.5073 vs 4\.3786/);
    expect(compareConclusion(a.pppSpot, a.pppSpot)).toBe('Scenarios A and B give the same PPP future rate: 4.3786 MYR/USD in one year.');
    for (const s of [compareConclusion(a.pppSpot, b.pppSpot), compareConclusion(a.pppSpot, d.pppSpot)]) {
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
  });
});
