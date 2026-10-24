import { describe, expect, it } from 'vitest';
import {
  csvNumber,
  fixed,
  formatDecimal,
  formatInputPct,
  formatMoney,
  formatPctChange,
  formatPp,
  formatPpAbs,
  formatRate,
  formatSpot,
  formatSpotUnit,
} from '../format';

describe('display formatting', () => {
  it('rates and exchange rates use 4 dp', () => {
    expect(formatRate(4.0375)).toBe('4.0375%');
    expect(formatRate(4.545)).toBe('4.5450%');
    expect(formatSpot(4.378640776699029)).toBe('4.3786');
    expect(formatSpotUnit(4.4)).toBe('4.4000 MYR/USD');
  });
  it('signed changes use a typographic minus and explicit plus', () => {
    expect(formatPctChange(-0.4854368932)).toBe('−0.4854%');
    expect(formatPctChange(0.487804878)).toBe('+0.4878%');
    expect(formatPp(-0.5075)).toBe('−0.5075 pp');
    expect(formatPp(2.5375)).toBe('+2.5375 pp');
  });
  it('never shows a signed zero', () => {
    expect(formatPctChange(0)).toBe('0.0000%');
    expect(formatPctChange(-1e-12)).toBe('0.0000%');
    expect(formatPp(-0)).toBe('0.0000 pp');
    expect(fixed(-0.00001, 4)).toBe('0.0000');
  });
  it('magnitudes and decimals', () => {
    expect(formatPpAbs(-0.119047619)).toBe('0.1190 pp');
    expect(formatDecimal(0.025)).toBe('0.025');
    expect(formatDecimal(1.040375)).toBe('1.040375');
    expect(formatDecimal(1.025 / 1.03)).toBe('0.9951456311');
    expect(formatInputPct(2.5)).toBe('2.50%');
    expect(formatInputPct(-1)).toBe('−1.00%');
    expect(formatInputPct(2.125)).toBe('2.125%');
  });
  it('CSV numbers are ASCII and 10 dp', () => {
    expect(csvNumber(-0.4854368932038835)).toBe('-0.4854368932');
    expect(csvNumber(-0)).toBe('0.0000000000');
    expect(csvNumber(Number.NaN)).toBe('');
  });
  it('non-finite values render as a dash, never as a number', () => {
    expect(fixed(Number.NaN, 4)).toBe('—');
    expect(formatSpot(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatMoney (teaching visuals)', () => {
  it('prints ringgit and US-dollar amounts at 4 dp by default, with a typographic minus', () => {
    expect(formatMoney('RM', 4.51)).toBe('RM 4.5100');
    expect(formatMoney('US$', 1.03)).toBe('US$1.0300');
    expect(formatMoney('RM', 1.040375, 6)).toBe('RM 1.040375');
    expect(formatMoney('US$', -0.5)).toBe('US$−0.5000');
  });
});
