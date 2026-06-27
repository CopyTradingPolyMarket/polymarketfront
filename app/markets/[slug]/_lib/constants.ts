import type { Range, ApiRange } from "@/app/markets/[slug]/_lib/types";

export const RANGE_MAP: Record<Range, ApiRange> = {
  "1H":  "1h",
  "6H":  "6h",
  "1D":  "1d",
  "1W":  "1w",
  "1M":  "1m",
  "ALL": "all",
};

export const RANGE_BUCKET: Record<ApiRange, string> = {
  "1h": "minute", "6h": "minute",
  "1d": "hour", "1w": "hour",
  "1m": "day", "all": "halfday",
};

export const SPOT_WINDOW_MS = 30_000;

export const RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;

export const TRADE_ERRORS: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Not enough balance",
  MARKET_NOT_FOUND:     "Market not found",
  MARKET_NOT_ACTIVE:    "Market is closed",
  NO_PRICE:             "Price unavailable — try again",
  INSUFFICIENT_SHARES:  "Not enough shares to sell",
};

export const SELL_ERRORS: Record<string, string> = {
  INSUFFICIENT_SHARES: "You don't have that many shares",
  MARKET_NOT_FOUND:    "Market not found",
  MARKET_RESOLVED:     "Market is already resolved",
  NO_PRICE:            "Price unavailable — try again",
};
