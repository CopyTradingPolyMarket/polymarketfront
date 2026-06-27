"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import SmallMarketCard from "./Marketcard";
import { formatVolume, type ApiMarket } from "@/src/services/marketGrouping";
import { formatLiveCryptoTitle } from "@/lib/liveCryptoTitle";
import type { Market } from "./Marketcard";

import { API_BASE } from "@/src/config/api";

// One generous fetch per category; subcategory filtering is done client-side
// from this batch. Raise if subcategories look thin, or switch to server-side
// fetching per tag if your `?category=` accepts arbitrary tags.
const FETCH_LIMIT = 150;

// Sort options for the "Trending" dropdown (top-right).
const SORTS: { label: string; value: string }[] = [
  { label: "Trending", value: "volume" },
  { label: "Breaking", value: "movers" },
  { label: "New",      value: "newest" },
];

// Tags we never surface as subcategories.
const NOISE = [/^rewards/i, /hide from/i, /^main /i, /futures$/i, /^all$/i];

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#131316] p-3.5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="w-6 h-6 rounded-md" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-24 rounded self-center" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="h-4 w-3/4 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="space-y-3">
        <div className="h-5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
      <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORTS.find((s) => s.value === value) ?? SORTS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 text-[13px] text-gray-300 hover:text-white hover:border-white/20 transition"
      >
        {current.label}
        <span className="text-gray-500"><Chevron /></span>
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-40 rounded-xl border border-white/10 bg-[#16171b] p-1 shadow-xl">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => { onChange(s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition ${
                  s.value === value ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CategoryPage({ category: categoryProp }: { category?: string }) {
  // Resolve the category from the prop if the server passed it; otherwise read
  // it from the route params directly (works regardless of Next version / how
  // params are passed). Falls back to the first route param if the dynamic
  // segment isn't literally named "[category]".
  const routeParams = useParams() as Record<string, string | string[] | undefined>;
  const rawParam = routeParams.category ?? Object.values(routeParams)[0];
  const fromParams = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const category = (categoryProp ?? fromParams ?? "").toString();

  const [items, setItems] = useState<ApiMarket[] | null>(null);
  const [error, setError] = useState(false);
  const [sub, setSub]     = useState<string | null>(null);
  const [sort, setSort]   = useState("volume");

  // Fetch the category batch (refetch on sort change).
  useEffect(() => {
    if (!category) return; // nothing to fetch until we have a category
    let cancelled = false;
    setItems(null);
    setError(false);
    setSub(null);

    const isLiveCrypto = category === "Live Crypto";
    const url = isLiveCrypto
      ? `${API_BASE}/api/markets/live-crypto?page=1&limit=${FETCH_LIMIT}`
      : `${API_BASE}/api/markets?category=${encodeURIComponent(category)}&sort=${sort}&page=1&limit=${FETCH_LIMIT}`;

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<{ items: ApiMarket[] }>; })
      .then((d) => { if (!cancelled) setItems(d.items ?? []); })
      .catch(() => { if (!cancelled) setError(true); });

    return () => { cancelled = true; };
  }, [category, sort]);

  // Subcategories from tags (frequency-ranked, noise filtered).
  const subcategories = useMemo(() => {
    if (!items) return [];
    const counts = new Map<string, number>();
    items.forEach((m) =>
      (m.tags ?? []).forEach((t) => {
        if (t.toLowerCase() === category.toLowerCase()) return;
        if (NOISE.some((re) => re.test(t))) return;
        counts.set(t, (counts.get(t) ?? 0) + 1);
      })
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [items, category]);

  // Pick the small caps label per card: prefer a subcategory the market belongs to.
  const subSet = useMemo(() => new Set(subcategories), [subcategories]);
  const cards = useMemo(() => {
    if (!items) return [];
    const base = sub ? items.filter((m) => (m.tags ?? []).includes(sub)) : items;
    return base.map((m): Market => {
      const tags = m.tags ?? [];
      const subTag = tags.find((t) => subSet.has(t));
      return {
        type:          (m as any).type ?? "market",
        id:            m.id,
        title:         (m.slug && formatLiveCryptoTitle(m.slug)) ?? m.title,
        image:         m.image ?? "",
        volume:        formatVolume(m.volume),
        options:       m.options,
        optionsCount:  m.options.length,
        categoryLabel: (subTag ?? category).toUpperCase(),
        slug:          m.slug,
        eventId:       m.eventId ?? "",
        eventMarketCount: (m as any).eventMarketCount ?? 1,
        eventSlug:     (m as any).eventSlug ?? undefined,
        gameId:        (m as any).gameId ?? undefined,
      };
    });
  }, [items, sub, subSet, category]);

  return (
    <div className="w-[60%] mx-auto px-4 py-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex gap-8">
        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-6 flex flex-col gap-0.5">
            <button
              onClick={() => setSub(null)}
              className={`text-left text-[12px] py-1 transition cursor-pointer ${
                sub === null ? "text-emerald-400 font-semibold" : "text-gray-400 hover:text-white"
              }`}
            >
              All markets
            </button>
            {subcategories.map((s) => (
              <button
                key={s}
                onClick={() => setSub(s)}
                className={`text-left text-[12px] py-1 transition cursor-pointer ${
                  sub === s ? "text-emerald-400 font-semibold" : "text-gray-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── Main ─── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[26px] font-bold text-white tracking-tight">{sub ?? category}</h1>

            <div className="flex items-center gap-2">
              <SortDropdown value={sort} onChange={setSort} />
              {/* Placeholders — wire up if/when your API supports them */}
              <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 text-[13px] text-gray-300 hover:text-white hover:border-white/20 transition">
                Frequency <span className="text-gray-500"><Chevron /></span>
              </button>
              <button className="w-9 h-9 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition flex items-center justify-center">
                ⋯
              </button>
            </div>
          </div>

          {error ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">Couldn&apos;t load markets.</p>
              <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
            </div>
          ) : items === null ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : cards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No markets here yet.</p>
              <p className="text-gray-600 text-xs mt-1">Try a different filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cards.map((m) => (
                <SmallMarketCard key={m.id} market={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
