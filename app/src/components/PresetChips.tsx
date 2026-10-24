import { PRESET_CHIPS } from '../lib/chips';
import { PRESETS, type PresetId } from '../lib/scenarios';

type Props = {
  active: PresetId | null;
  onPick: (id: PresetId) => void;
  dark?: boolean;
  label?: string;
};

/**
 * Scenario presets as chips. The selected one is shown by its amber fill, a navy inner
 * outline and aria-pressed; chips carry no icon, so selecting one never changes any width.
 */
export function PresetChips({ active, onPick, dark = false, label = 'Scenario presets' }: Props) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {PRESET_CHIPS.map((chip) => {
        const on = chip.id === active;
        return (
          <button
            key={chip.id}
            type="button"
            className={`chip ${dark ? 'chip-dark' : ''}`}
            aria-pressed={on}
            title={PRESETS[chip.id].description}
            onClick={() => onPick(chip.id)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
