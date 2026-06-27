import { Market } from "@/types/market";
import type { RANGES } from "@/app/markets/[slug]/_lib/constants";

export interface ApiMarketDetail {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  tags: string[];
  slug: string;
  description: string | null;
  resolved: boolean;
  outcome: number | null;
  isLiveCrypto?: boolean;
  spot?: { symbol: string; value: number } | null;
  eventId: string;
  gameId?: number | null;
  sportsMarketType?: string | null;
}

export interface ApiChartPoint {
  t: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
}

export type ChartShape = "line" | "candlestick";

export interface RelatedMarket {
  slug: string;
  title: string;
  image: string | null;
  options: { label: string; probability: number }[];
}

export type ApiRange = "1h" | "6h" | "1d" | "1w" | "1m" | "all";

export type Range = (typeof RANGES)[number];

export interface MappedMarket extends Market {
  isLiveCrypto: boolean;
  spot: { symbol: string; value: number } | null;
  resolved?: boolean;
}
