import { useEffect, useState } from "react";

import { API_BASE } from "@/src/config/api";

// We fetch this many per (category, sort) ONCE, then every consumer slices down
// to what it needs — so MarketsList (needs ~4) and HomeSidebar (needs ~5) share
// a single network request instead of each firing their own.
const SHARED_LIMIT = 20;

// A given (category, sort) is re-fetched at most once per this window.
const TTL_MS = 60_000;

export interface ApiMarket {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  tags?: string[];
  slug: string;
  eventId: string | null;
  change?: number; // pp delta, if your backend provides it
}

interface ApiResponse {
  items: ApiMarket[];
}

// ─── Module-level cache (shared across every component for the session) ───────

type Entry = { ts: number; promise: Promise<ApiMarket[]> };
const cache = new Map<string, Entry>();

const keyOf = (category: string, sort: string) => `${category}|${sort}`;

function load(category: string, sort: string): Promise<ApiMarket[]> {
  const key = keyOf(category, sort);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.promise;

  const isLiveCrypto = category === "Live Crypto";
  const url = isLiveCrypto
    ? `${API_BASE}/api/markets/live-crypto?page=1&limit=${SHARED_LIMIT}`
    : `${API_BASE}/api/markets?category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=1&limit=${SHARED_LIMIT}`;

  const promise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load "${category}"`);
      return r.json() as Promise<ApiResponse>;
    })
    .then((d) => d.items ?? [])
    .catch((e) => {
      cache.delete(key); // never cache a failure
      throw e;
    });

  cache.set(key, { ts: Date.now(), promise });
  return promise;
}

/** Imperative accessor — handy inside an existing Promise.all in a parent. */
export function fetchCategoryMarkets(category: string, sort = "volume") {
  return load(category, sort);
}

/** Manually drop cached data (e.g. on a pull-to-refresh). */
export function invalidateCategoryMarkets(category?: string, sort = "volume") {
  if (!category) { cache.clear(); return; }
  cache.delete(keyOf(category, sort));
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** One category. `items` is null while loading. */
export function useCategoryMarkets(category: string, sort = "volume") {
  const [items, setItems] = useState<ApiMarket[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(false);
    load(category, sort)
      .then((it) => { if (!cancelled) setItems(it); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [category, sort]);

  return { items, loading: items === null && !error, error };
}

/** Several categories at once → map of category → markets. */
export function useCategoriesMarkets(categories: string[], sort = "volume") {
  const [data, setData] = useState<Record<string, ApiMarket[]> | null>(null);
  const [error, setError] = useState(false);
  const key = categories.join(",") + "|" + sort;

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    Promise.all(categories.map((c) => load(c, sort).then((it) => [c, it] as const)))
      .then((pairs) => { if (!cancelled) setData(Object.fromEntries(pairs)); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  // `key` encodes categories + sort
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading: data === null && !error, error };
}
