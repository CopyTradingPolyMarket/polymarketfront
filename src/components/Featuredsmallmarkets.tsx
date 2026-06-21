"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SmallMarketCard from "./Marketcard";
import type { Market } from "./Marketcard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ApiMarket {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  slug: string;
  eventId: string | null;
}

interface ApiResponse {
  items: ApiMarket[];
  page: number;
  totalPages: number;
  total: number;
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
    eventId: api.eventId ?? "",
  };
}

// Computes which page numbers (and '...' sentinels) to render.
// Always shows: page 1, page total, and currentPage ± 1.
// If a gap is exactly one number wide, shows the number instead of '...'.
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const candidates = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total)
  );
  const sorted = Array.from(candidates).sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap === 2) {
        result.push(sorted[i] - 1); // single missing number — show it instead of '...'
      } else if (gap > 2) {
        result.push("...");
      }
    }
    result.push(sorted[i]);
  }
  return result;
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

const BTN_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
  height: 32,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#9ca3af",
  padding: "0 10px",
};
const BTN_ACTIVE: React.CSSProperties = {
  ...BTN_BASE,
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#ffffff",
  fontWeight: 700,
};
const BTN_DISABLED: React.CSSProperties = {
  ...BTN_BASE,
  opacity: 0.3,
  cursor: "not-allowed",
};

function PaginationBar({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = getPageNumbers(current, total);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        marginTop: 28,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => onPage(current - 1)}
        disabled={current === 1}
        style={current === 1 ? BTN_DISABLED : BTN_BASE}
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            style={{ color: "#4b5563", padding: "0 4px", fontSize: 13, userSelect: "none" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            style={p === current ? BTN_ACTIVE : BTN_BASE}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(current + 1)}
        disabled={current === total}
        style={current === total ? BTN_DISABLED : BTN_BASE}
      >
        Next →
      </button>
    </div>
  );
}

export default function MarketsList() {
  const searchParams = useSearchParams();

  // Read filter values from URL. "sort=breaking" is a UI-only token — it maps
  // to sort=volume for the API call (Breaking has no distinct API sort).
  const urlCategory = searchParams.get("category") ?? "";
  const urlSort     = searchParams.get("sort")     ?? "";
  const urlSearch   = searchParams.get("search")   ?? "";
  const apiSort     = urlSort === "breaking" ? "movers" : (urlSort || "volume");

  const [markets,     setMarkets]     = useState<Market[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);

  const topRef        = useRef<HTMLDivElement>(null);
  // Track the last-fetched filter so we can detect when it changes and reset page.
  const prevFilterRef = useRef({ category: urlCategory, sort: urlSort, search: urlSearch });

  useEffect(() => {
    const filterChanged =
      prevFilterRef.current.category !== urlCategory ||
      prevFilterRef.current.sort     !== urlSort     ||
      prevFilterRef.current.search   !== urlSearch;

    prevFilterRef.current = { category: urlCategory, sort: urlSort, search: urlSearch };

    // When filter changes, always fetch page 1. Also reset the page indicator
    // so the pagination bar reflects the correct page. If currentPage is already
    // 1 this setState is a no-op and causes no extra re-render.
    const pageToFetch = filterChanged ? 1 : currentPage;
    if (filterChanged && currentPage !== 1) setCurrentPage(1);

    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    params.set("page",  String(pageToFetch));
    params.set("limit", "20");
    params.set("sort",  apiSort);
    if (urlCategory) params.set("category", urlCategory);
    if (urlSearch)   params.set("search",   urlSearch);

    let cancelled = false;
    fetch(`${API_BASE}/api/markets?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setMarkets(data.items.map(mapMarket));
        setTotalPages(data.totalPages);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // apiSort is derived from urlSort so no need to include it separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, urlCategory, urlSort, urlSearch]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelect = (marketId: string, option: string, value: "yes" | "no") => {
    console.log({ marketId, option, value });
  };

  const gridContent = (() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
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
    if (markets.length === 0) {
      return (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <p className="text-gray-400 text-sm">
              {urlSearch ? "No markets found for your search." : "No markets in this category."}
            </p>
            <p className="text-gray-600 text-xs mt-1">
              {urlSearch
                ? "Try different keywords or browse by category."
                : "Check back soon or try a different filter."}
            </p>
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
  })();

  return (
    <div ref={topRef}>
      {gridContent}
      {totalPages > 1 && (
        <PaginationBar current={currentPage} total={totalPages} onPage={goToPage} />
      )}
    </div>
  );
}
