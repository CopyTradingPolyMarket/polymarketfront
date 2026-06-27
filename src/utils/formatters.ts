// Shared numeric formatters (volume + PnL).
// Centralizes variants that previously lived inline across many components.
// Options exist so every call site can reproduce its exact prior output.

export interface VolumeFormatOptions {
  /** Text appended after the value (e.g. " vol"). Default "". */
  suffix?: string;
  /** Decimal places for the millions tier ($X.XM). Default 1. */
  millionDigits?: number;
  /** Decimal places for the thousands tier ($XK). Default 0. */
  thousandDigits?: number;
  /** Decimal places for sub-1000 values ($X). Default 0. */
  baseDigits?: number;
}

/** Abbreviated volume: $X.XM / $XK / $X (+ optional suffix). */
export function formatVolume(value: number, options: VolumeFormatOptions = {}): string {
  const {
    suffix = "",
    millionDigits = 1,
    thousandDigits = 0,
    baseDigits = 0,
  } = options;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(millionDigits)}M${suffix}`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(thousandDigits)}K${suffix}`;
  return `$${value.toFixed(baseDigits)}${suffix}`;
}

/** Exact volume with thousands separators: "$1,234,567 vol". */
export function formatVolumeExact(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")} vol`;
}

/** Signed PnL: +$X.XM / +$1,234 / +$X.XX (sign always shown). */
export function formatPnl(usdc: number): string {
  const sign = usdc >= 0 ? "+" : "-";
  const abs = Math.abs(usdc);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString()}`;
  return `${sign}$${abs.toFixed(2)}`;
}
