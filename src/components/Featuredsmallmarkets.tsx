"use client";

import { useEffect, useState } from "react";
import SmallMarketCard from "./Marketcard";
import type { Market } from "./Marketcard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface ApiMarket {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  slug: string;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M vol`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K vol`;
  return `$${v.toFixed(0)} vol`;
}

function mapMarket(api: ApiMarket): Market {
  return {
    id:      api.id,
    title:   api.title,
    image:   api.image ?? "",
    volume:  formatVolume(api.volume),
    options: api.options,
    slug:    api.slug,
  };
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111113] p-4 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="flex-1">
          <div className="h-3 rounded mb-1.5 w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-3 rounded w-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-7 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-7 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="h-3 rounded w-1/3 pt-2" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

export default function MarketsList() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/markets?page=1&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<{ items: ApiMarket[] }>;
      })
      .then((data) => setMarkets(data.items.map(mapMarket)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (marketId: string, option: string, value: "yes" | "no") => {
    console.log({ marketId, option, value });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <p className="text-gray-400 text-sm">Couldn&apos;t load markets.</p>
          <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {markets.map((market) => (
        <SmallMarketCard key={market.id} market={market} onSelect={handleSelect} />
      ))}
    </div>
  );
}
