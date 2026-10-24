/**
 * Preset chips for the Simulator and Compare screens, and which one (if any)
 * matches the current inputs. Display helpers only; presets live in scenarios.ts.
 */
import type { Inputs } from './finance';
import { PRESETS, type PresetId } from './scenarios';

export type Chip = { id: PresetId; label: string };

export const PRESET_CHIPS: Chip[] = [
  { id: 'A', label: 'Baseline' },
  { id: 'B', label: 'US inflation spike' },
  { id: 'C', label: 'Equal' },
  { id: 'D', label: 'MY higher' },
  { id: 'E', label: 'Extreme MY' },
  { id: 'F', label: 'Extreme US' },
];

function realRates(x: Inputs): [number, number] {
  return x.advanced ? [x.myRealRatePct ?? x.realRatePct, x.usRealRatePct ?? x.realRatePct] : [x.realRatePct, x.realRatePct];
}

/** True when two input sets describe the same scenario (exact comparison, no rounding). */
export function sameInputs(a: Inputs, b: Inputs): boolean {
  const [aMY, aUS] = realRates(a);
  const [bMY, bUS] = realRates(b);
  return (
    a.advanced === b.advanced &&
    a.myInflationPct === b.myInflationPct &&
    a.usInflationPct === b.usInflationPct &&
    aMY === bMY &&
    aUS === bUS &&
    a.spotMyrPerUsd === b.spotMyrPerUsd
  );
}

/** The preset whose inputs match exactly, or null for a custom scenario. */
export function activePresetId(x: Inputs | null): PresetId | null {
  if (!x) return null;
  const match = (Object.keys(PRESETS) as PresetId[]).find((id) => sameInputs(PRESETS[id].inputs, x));
  return match ?? null;
}
