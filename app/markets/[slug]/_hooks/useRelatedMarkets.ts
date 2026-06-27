"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/src/config/api";
import type { RelatedMarket } from "@/app/markets/[slug]/_lib/types";

export function useRelatedMarkets(marketTags: string[], marketSlug: string) {
  const [relatedMarkets, setRelatedMarkets] = useState<RelatedMarket[]>([]);

  // Fetch top trending markets from the same category, exclude current slug
  useEffect(() => {
    if (marketTags.length === 0) return;
    const tag = marketTags[0];
    fetch(`${API_BASE}/api/markets?category=${encodeURIComponent(tag)}&sort=volume&limit=4&includeResolved=false`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data: { items: RelatedMarket[] }) => {
        setRelatedMarkets((data.items ?? []).filter((m) => m.slug !== marketSlug).slice(0, 3));
      })
      .catch(() => setRelatedMarkets([]));
  }, [marketTags, marketSlug]);

  return relatedMarkets;
}
