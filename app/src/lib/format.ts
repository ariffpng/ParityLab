/**
 * Display formatting ONLY. Nothing in this file may feed back into a calculation.
 * Exchange rates: 4 dp. Rates and percentage changes: 4 dp.
 * Uses the typographic minus sign (U+2212); `toAscii` converts for CSV/plain text.
 */

export const MINUS = '−';
export const RATE_DP = 4;
export const SPOT_DP = 4;

/** Fixed decimals with a typographic minus; never shows "−0.0000". */
export function fixed(n: number, dp: number): string {
  if (!Number.isFinite(n)) return '—';
  const text = n.toFixed(dp);
  if (/^-0(\.0+)?$/.test(text)) return text.slice(1);
  return text.replace('-', MINUS);
}

/** Fixed decimals with an explicit sign: "+0.4878", "−0.4854", "0.0000". */
export function signedFixed(n: number, dp: number): string {
  const text = fixed(n, dp);
  if (text === '—' || text.startsWith(MINUS) || /^0(\.0+)?$/.test(text)) return text;
  return `+${text}`;
}

/** A rate level, e.g. a Fisher-implied nominal rate: "4.0375%". */
export function formatRate(pct: number): string {
  return `${fixed(pct, RATE_DP)}%`;
}

/** A signed percentage change in a level: "−0.4854%", "+0.4878%". */
export function formatPctChange(pct: number): string {
  return `${signedFixed(pct, RATE_DP)}%`;
}

/** A signed difference between two rates, in percentage points: "−0.5075 pp". */
export function formatPp(pp: number): string {
  return `${signedFixed(pp, RATE_DP)} pp`;
}

/** An unsigned magnitude in percentage points: "0.1190 pp". */
export function formatPpAbs(pp: number): string {
  return `${fixed(Math.abs(pp), RATE_DP)} pp`;
}

/** An exchange-rate level without unit: "4.3786". */
export function formatSpot(s: number): string {
  return fixed(s, SPOT_DP);
}

/** An exchange-rate level with the quotation unit: "4.3786 MYR/USD". */
export function formatSpotUnit(s: number): string {
  return `${formatSpot(s)} MYR/USD`;
}

/** A signed change in an exchange-rate level: "−0.0834 MYR/USD". */
export function formatSpotChange(ds: number): string {
  return `${signedFixed(ds, SPOT_DP)} MYR/USD`;
}

/** Ringgit price of USD 1: "RM 4.3786". */
export function formatRinggit(s: number): string {
  return `RM ${formatSpot(s)}`;
}

/** An amount of money for the teaching visuals: "RM 4.5100", "US$1.0300". */
export function formatMoney(currency: 'RM' | 'US$', amount: number, dp = SPOT_DP): string {
  return currency === 'RM' ? `RM ${fixed(amount, dp)}` : `US$${fixed(amount, dp)}`;
}

/**
 * An input assumption as typed (2–4 dp, trailing zeros trimmed past 2):
 * 2.5 → "2.50%", 2.125 → "2.125%".
 */
export function formatInputPct(pct: number): string {
  return `${trimmed(pct, 2, 4)}%`;
}

/** An input difference in percentage points (2–4 dp): "0.50 pp". */
export function formatInputPp(pp: number): string {
  return `${trimmed(pp, 2, 4)} pp`;
}

/** A decimal for formula traces (up to `maxDp` dp, trailing zeros trimmed): "0.025", "0.9951456311". */
export function formatDecimal(x: number, maxDp = 10): string {
  return trimmed(x, 0, maxDp);
}

function trimmed(n: number, minDp: number, maxDp: number): string {
  if (!Number.isFinite(n)) return '—';
  let text = n.toFixed(maxDp);
  if (text.includes('.')) {
    text = text.replace(/0+$/, '');
    const [whole, frac = ''] = text.split('.');
    const padded = frac.padEnd(minDp, '0');
    text = padded.length > 0 ? `${whole}.${padded}` : whole;
  }
  if (/^-0(\.0+)?$/.test(text)) text = text.slice(1);
  return text.replace('-', MINUS);
}

/** Plain machine-readable number for CSV cells (ASCII minus, 10 dp). */
export function csvNumber(n: number, dp = 10): string {
  if (!Number.isFinite(n)) return '';
  const text = n.toFixed(dp);
  return /^-0(\.0+)?$/.test(text) ? text.slice(1) : text;
}
