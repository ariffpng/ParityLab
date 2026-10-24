import { useId, useState } from 'react';
import type { FieldErrors, RawInputs } from '../lib/validation';
import type { PresetId } from '../lib/scenarios';
import { RateField, SpotField } from './Fields';
import { InfoTip } from './InfoTip';
import { PresetChips } from './PresetChips';
import { ArrowRightIcon, ChevronIcon, CopyIcon, ResetIcon } from './Icons';

type Props = {
  raw: RawInputs;
  errors: FieldErrors;
  valid: boolean;
  activePreset: PresetId | null;
  onChange: (next: RawInputs) => void;
  onPreset: (id: PresetId) => void;
  onReset: () => void;
  onSendToCompare: () => void;
  onCopySummary: () => void;
  /** Element ids the guided lesson highlights. */
  highlight: string[];
};

const fid = (name: string) => `sim-field-${name}`;

/**
 * The dark navy inputs panel. On phones it becomes a sticky, collapsible
 * "Your assumptions" sheet (CSS only below 768 px; always open on larger screens).
 *
 * Layout stability: the summary bar and its buttons never move; in advanced mode
 * the real-rate slot keeps its height and the two country fields appear inside
 * "More options", below the switch that turned them on.
 */
export function AssumptionsPanel({
  raw,
  errors,
  valid,
  activePreset,
  onChange,
  onPreset,
  onReset,
  onSendToCompare,
  onCopySummary,
  highlight,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(raw.advanced);
  const [seenAdvanced, setSeenAdvanced] = useState(raw.advanced);
  // Loading an advanced scenario opens "More options" so the switch is visible.
  if (raw.advanced !== seenAdvanced) {
    setSeenAdvanced(raw.advanced);
    if (raw.advanced) setMoreOpen(true);
  }
  const bodyId = useId();
  const moreId = useId();
  const set = (patch: Partial<RawInputs>) => onChange({ ...raw, ...patch });
  const lit = (name: string) => highlight.includes(fid(name));
  // When the guided lesson points at an input, the collapsed phone sheet is ringed
  // instead of being opened, so nothing below it jumps.
  const lessonPointsHere = highlight.some((h) => h.startsWith('sim-field-'));
  const summary = `MY ${raw.myInflation}% · US ${raw.usInflation}% · ${raw.advanced ? `r ${raw.myRealRate}/${raw.usRealRate}%` : `r ${raw.realRate}%`} · RM ${raw.spot}`;

  const toggleAdvanced = () => {
    if (!raw.advanced) set({ advanced: true, myRealRate: raw.realRate, usRealRate: raw.realRate });
    else set({ advanced: false });
  };

  return (
    <section
      aria-labelledby="assumptions-heading"
      className={`on-dark max-md:sticky max-md:top-0 max-md:z-20 rounded-2xl bg-panel text-on-panel shadow-lg max-md:-mx-4 max-md:rounded-none ${lessonPointsHere && !sheetOpen ? 'lesson-ring-mobile' : ''}`}
    >
      <div className="flex items-center gap-2 px-6 pb-2 pt-4 max-md:px-4 max-md:py-2">
        <h2 id="assumptions-heading" className="text-lg font-bold">
          Your assumptions
        </h2>
        <InfoTip label="About your assumptions" dark>
          Expected inflation assumption: one-year expectations you choose, not today&apos;s published inflation. All values are
          hypothetical teaching assumptions.
        </InfoTip>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="btn btn-icon btn-dark"
            onClick={onReset}
            aria-label="Reset to baseline"
            title="Reset to baseline"
          >
            <ResetIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-dark md:hidden"
            aria-label="Edit assumptions"
            aria-expanded={sheetOpen}
            aria-controls={bodyId}
            onClick={() => setSheetOpen((o) => !o)}
          >
            <ChevronIcon className={`h-5 w-5 transition-transform ${sheetOpen ? 'rotate-180' : ''}`} />
          </button>
        </span>
      </div>
      <p className="truncate px-4 pb-2 text-sm tabular text-on-panel-2 md:hidden" aria-hidden="true">
        {summary}
      </p>

      <div id={bodyId} className={`${sheetOpen ? '' : 'max-md:hidden'} max-md:max-h-[70vh] max-md:overflow-y-auto`}>
        <div className="space-y-1 px-6 pb-6 max-md:px-4">
          <RateField
            id={fid('myInflation')}
            field="myInflation"
            label="Malaysia inflation"
            dot="my"
            dark
            value={raw.myInflation}
            error={errors.myInflation}
            onChange={(v) => set({ myInflation: v })}
            highlighted={lit('myInflation')}
          />
          <RateField
            id={fid('usInflation')}
            field="usInflation"
            label="US inflation"
            dot="us"
            dark
            value={raw.usInflation}
            error={errors.usInflation}
            onChange={(v) => set({ usInflation: v })}
            highlighted={lit('usInflation')}
          />
          {/* In advanced mode the common field stays laid out (hidden), so its slot keeps exactly
              the same size and nothing below it moves; a note takes its place. */}
          <div className="grid">
            <div
              className="col-start-1 row-start-1 min-w-0"
              style={raw.advanced ? { visibility: 'hidden' } : undefined}
              aria-hidden={raw.advanced ? true : undefined}
              inert={raw.advanced}
            >
              <RateField
                id={fid('realRate')}
                field="realRate"
                label="Real interest rate"
                dark
                value={raw.realRate}
                error={raw.advanced ? undefined : errors.realRate}
                onChange={(v) => set({ realRate: v })}
                highlighted={lit('realRate')}
              />
            </div>
            {raw.advanced && (
              <div className="col-start-1 row-start-1 flex flex-col justify-center gap-2 rounded-xl border border-dashed border-panel-line px-4">
                <span className="flex items-center justify-between gap-4 text-base font-semibold text-on-panel">
                  Real interest rate <span className="tag tag-dark">per country</span>
                </span>
                <span className="text-sm text-on-panel-2">Set separately under More options ↓</span>
              </div>
            )}
          </div>

          <div className="border-t border-panel-line pt-4">
            <SpotField
              id={fid('spot')}
              dark
              value={raw.spot}
              error={errors.spot}
              onChange={(v) => set({ spot: v })}
              highlighted={lit('spot')}
              aside={
                <>
                  <span className="tag tag-dark">hypothetical</span>
                  <InfoTip label="About today's rate" dark>
                    Spot rate (hypothetical, not a live quote): the ringgit paid for US$1 today, quoted as MYR/USD.
                  </InfoTip>
                </>
              }
            />
          </div>

          <div className="border-t border-panel-line pt-4">
            <PresetChips active={activePreset} onPick={onPreset} dark />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-panel-line pt-4">
            <button type="button" className="btn btn-dark" onClick={onSendToCompare} disabled={!valid}>
              Send to Compare <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-dark"
              onClick={onCopySummary}
              disabled={!valid}
              aria-label="Copy scenario summary"
              title="Copy scenario summary"
            >
              <CopyIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-panel-line pt-2">
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 rounded-lg text-left text-base font-semibold text-on-panel"
              aria-expanded={moreOpen}
              aria-controls={moreId}
              onClick={() => setMoreOpen((o) => !o)}
            >
              <ChevronIcon className={`h-5 w-5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              More options
            </button>
            {/* Closed: hidden on larger screens; on phones it keeps its space (invisible) so closing it
                can never shift the scrolled sheet. */}
            <div
              id={moreId}
              className={`space-y-3 pt-2 ${moreOpen ? '' : 'hidden max-md:block max-md:invisible'}`}
              inert={!moreOpen}
            >
              <button
                type="button"
                role="switch"
                aria-checked={raw.advanced}
                onClick={toggleAdvanced}
                className="flex min-h-11 items-center gap-4 rounded-lg text-left font-semibold text-on-panel"
              >
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-panel-line transition-colors ${raw.advanced ? 'bg-accent' : 'bg-panel-2'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-on-panel transition-transform ${raw.advanced ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </span>
                Separate real rates (advanced)
              </button>
              <button type="button" className="btn btn-sm btn-dark" onClick={() => onPreset('ADV')}>
                Load example: unequal real rates
              </button>
              {/* Country real rates: shown in advanced mode; on phones their space is always kept. */}
              <div className={`space-y-3 ${raw.advanced ? '' : 'hidden max-md:block max-md:invisible'}`} inert={!raw.advanced}>
                <>
                  <RateField
                    id={fid('myRealRate')}
                    field="myRealRate"
                    label="Malaysia real rate"
                    dot="my"
                    dark
                    value={raw.myRealRate}
                    error={errors.myRealRate}
                    onChange={(v) => set({ myRealRate: v })}
                    highlighted={lit('myRealRate')}
                  />
                  <RateField
                    id={fid('usRealRate')}
                    field="usRealRate"
                    label="US real rate"
                    dot="us"
                    dark
                    value={raw.usRealRate}
                    error={errors.usRealRate}
                    onChange={(v) => set({ usRealRate: v })}
                    highlighted={lit('usRealRate')}
                  />
                </>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
