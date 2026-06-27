"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/src/config/api";
import { isConditionId, mapMarket } from "@/app/markets/[slug]/_lib/helpers";
import type { ApiMarketDetail, MappedMarket } from "@/app/markets/[slug]/_lib/types";

export function useMarketDetail(slug: string, router: ReturnType<typeof useRouter>) {
  const [market,     setMarket]     = useState<MappedMarket | null>(null);
  const [notFound,   setNotFound]   = useState(false);
  const [loadError,  setLoadError]  = useState(false);
  const [marketTags, setMarketTags] = useState<string[]>([]);
  const [marketSlug, setMarketSlug] = useState("");

  // Fetch market detail
  useEffect(() => {
    setMarket(null);
    setNotFound(false);
    setLoadError(false);
    const marketUrl = isConditionId(slug)
      ? `${API_BASE}/api/markets/${slug}`
      : `${API_BASE}/api/markets/by-slug/${slug}`;
    fetch(marketUrl)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiMarketDetail>;
      })
      .then((data) => {
        if (data) {
          if (data.gameId && data.sportsMarketType) {
            router.replace(`/sports/${data.gameId}`);
            return;
          }
          setMarket(mapMarket(data));
          setMarketTags(data.tags ?? []);
          setMarketSlug(data.slug ?? "");
        }
      })
      .catch(() => setLoadError(true));
  }, [slug]);

  return { market, notFound, loadError, marketTags, marketSlug };
}
