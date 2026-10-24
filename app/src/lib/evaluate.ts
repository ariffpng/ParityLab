/**
 * Validate raw UI text and, only if every active field is valid, run the engine.
 * An invalid input yields `results: null` so the UI can never show stale numbers.
 */
import { calculate, type Inputs, type Results } from './finance';
import { validateInputs, type FieldErrors, type RawInputs } from './validation';

export type Evaluation =
  | { ok: true; inputs: Inputs; results: Results; errors: FieldErrors }
  | { ok: false; inputs: null; results: null; errors: FieldErrors };

export function evaluate(raw: RawInputs): Evaluation {
  const validation = validateInputs(raw);
  if (!validation.ok) return { ok: false, inputs: null, results: null, errors: validation.errors };
  return { ok: true, inputs: validation.inputs, results: calculate(validation.inputs), errors: {} };
}
