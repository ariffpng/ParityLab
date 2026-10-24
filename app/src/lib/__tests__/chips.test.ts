import { describe, expect, it } from 'vitest';
import { activePresetId, PRESET_CHIPS, sameInputs } from '../chips';
import { PRESETS } from '../scenarios';

describe('preset chips', () => {
  it('offers the six teaching cases A–F in order', () => {
    expect(PRESET_CHIPS.map((c) => c.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(PRESET_CHIPS.map((c) => c.label)).toEqual([
      'Baseline',
      'US inflation spike',
      'Equal',
      'MY higher',
      'Extreme MY',
      'Extreme US',
    ]);
  });

  it('recognises each preset exactly and nothing else', () => {
    for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'ADV'] as const) {
      expect(activePresetId(PRESETS[id].inputs)).toBe(id);
    }
    expect(activePresetId({ ...PRESETS.A.inputs, usInflationPct: 3.1 })).toBeNull();
    expect(activePresetId({ ...PRESETS.A.inputs, spotMyrPerUsd: 4.5 })).toBeNull();
    expect(activePresetId(null)).toBeNull();
  });

  it('treats advanced mode with equal real rates as different from core mode', () => {
    const adv = { ...PRESETS.A.inputs, advanced: true, myRealRatePct: 1.5, usRealRatePct: 1.5 };
    expect(sameInputs(adv, PRESETS.A.inputs)).toBe(false);
    expect(sameInputs(adv, { ...adv })).toBe(true);
  });
});
