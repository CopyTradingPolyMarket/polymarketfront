"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SmallMarketCard from "./Marketcard";
import type { Market, MarketOption } from "./Marketcard";
import { formatLiveCryptoTitle } from "@/lib/liveCryptoTitle";
import LiveSportsList from "./LiveSportsList";
import { fetchCategoryMarkets } from "@/src/services/useCategoryMarkets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// `tags` mixes broad categories ("Soccer", "Sports") with narrower/dynamic
// tags ("2026 FIFA World Cup", "Hide From New"). We pick the category by
// checking which of OUR known top-level categories appears in a market's
// tags, in this priority order — reorder/extend to match your real taxonomy.
// This same list also defines which sections show up on the home feed.
const CATEGORIES = [
  "Pro Basketball (M)",
  "Crypto",
  "Soccer",
  "Politics",
  "Sports",
];
const HOME_SECTION_LIMIT = 4;

function categoryFromTags(tags: string[] | undefined): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  return CATEGORIES.find((known) => tags.includes(known));
}

interface ApiMarketOption {
  label: string;
  probability: number; // already 0–100
}

interface ApiMarket {
  type?: "market" | "event" | "game";
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: ApiMarketOption[];
  tags: string[];
  slug: string;
  eventId: string | null;
  eventMarketCount?: number;
  eventSlug?: string | null;
  gameId?: number | null;
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
  const isGrouped = api.type === "event" || api.type === "game";
  return {
    type:          api.type ?? "market",
    id:            api.id,
    title:         isGrouped ? api.title : ((api.slug && formatLiveCryptoTitle(api.slug)) ?? api.title),
    image:         api.image ?? "",
    volume:        formatVolume(api.volume),
    options:       api.options,
    optionsCount:  api.options.length,
    categoryLabel: categoryFromTags(api.tags),
    slug:          api.slug,
    eventId:       api.eventId ?? "",
    eventMarketCount: api.eventMarketCount ?? 1,
    eventSlug:     api.eventSlug ?? undefined,
    gameId:        api.gameId ?? undefined,
  };
}

// --- eventId grouping -------------------------------------------------
//
// Several markets can share the same eventId (e.g. one "Will <country> win
// the World Cup?" market per country). Those are really the N options of a
// single event, so we merge them into one multi-option card instead of N
// separate Yes/No cards.
//
// NOTE: grouping only works within the markets already returned in one
// page/batch. If the backend paginates by individual markets (not events),
// siblings of the same event can land on different pages and the grouping
// will look "broken" (some options on one page, some on another). For the
// home feed (top markets by volume) this is essentially never an issue; for
// the full paginated category view it can be — the proper fix is for the
// backend to paginate by event rather than by market.
//
// Only recognizes the "Will X win Y?" phrasing seen in the sample data so
// far. Add more entries here as you run into other title shapes that should
// be grouped. If a group's titles don't all match a known template, we don't
// guess — we just render that group as separate individual cards.
const EVENT_TEMPLATES: {
  match: RegExp;
  eventTitle: (m: RegExpMatchArray) => string;
}[] = [
  {
    match: /^Will (.+?) win (.+?)\??$/i,
    eventTitle: (m) => `${m[2].replace(/^the\s+/i, "")} — Winner`,
  },
];

function extractOptionLabel(title: string): { label: string; eventTitle: string } | null {
  for (const tpl of EVENT_TEMPLATES) {
    const m = title.match(tpl.match);
    if (m) return { label: m[1], eventTitle: tpl.eventTitle(m) };
  }
  return null;
}

function buildEventCard(group: ApiMarket[]): Market | null {
  const parsed = group.map((m) => ({ market: m, info: extractOptionLabel(m.title) }));
  if (parsed.some((p) => !p.info)) return null; // not every sibling matched a known template — bail out

  const eventTitle = parsed[0].info!.eventTitle;

  const options: MarketOption[] = parsed
    .map(({ market, info }) => {
      const yes = market.options.find((o) => o.label.toLowerCase() === "yes") ?? market.options[0];
      return {
        label: info!.label,
        probability: yes?.probability ?? 0,
        image: market.image ?? undefined,
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const top = group.reduce((best, m) => (m.volume > best.volume ? m : best), group[0]);

  return {
    id:            group[0].eventId ?? group[0].id,
    title:         eventTitle,
    image:         top.image ?? "",
    volume:        formatVolume(group.reduce((sum, m) => sum + m.volume, 0)),
    options,
    optionsCount:  group.length,
    categoryLabel: categoryFromTags(group[0].tags),
    slug:          top.slug, // placeholder until there's a dedicated event-level page/slug
    eventId:       group[0].eventId ?? "",
  };
}

function groupMarketsByEvent(items: ApiMarket[]): Market[] {
  const groups = new Map<string, ApiMarket[]>();
  items.forEach((item) => {
    const key = item.eventId ?? `solo:${item.id}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });

  const withVolume: { market: Market; volume: number }[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      withVolume.push({ market: mapMarket(group[0]), volume: group[0].volume });
      return;
    }

    const eventCard = buildEventCard(group);
    if (eventCard) {
      withVolume.push({ market: eventCard, volume: group.reduce((s, m) => s + m.volume, 0) });
    } else {
      group.forEach((m) => withVolume.push({ market: mapMarket(m), volume: m.volume }));
    }
  });

  return withVolume.sort((a, b) => b.volume - a.volume).map((w) => w.market);
}
// -----------------------------------------------------------------------

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
        result.push(sorted[i] - 1);
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
    <div className="rounded-2xl border border-white/5 bg-[#0E0E10] p-4 animate-pulse">
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

function SectionSkeleton() {
  return (
    <div className="mb-10">
      <div className="h-5 w-40 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
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
      <button onClick={() => onPage(current - 1)} disabled={current === 1} style={current === 1 ? BTN_DISABLED : BTN_BASE}>
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ color: "#4b5563", padding: "0 4px", fontSize: 13, userSelect: "none" }}>
            …
          </span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)} style={p === current ? BTN_ACTIVE : BTN_BASE}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onPage(current + 1)} disabled={current === total} style={current === total ? BTN_DISABLED : BTN_BASE}>
        Next →
      </button>
    </div>
  );
}

interface CategorySectionData {
  category: string;
  markets: Market[];
}

function CategorySection({
  data,
  onSelect,
}: {
  data: CategorySectionData;
  onSelect: (marketId: string, optionLabel: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="mb-10">
      <button
        onClick={() => router.push(`/category/${encodeURIComponent(data.category)}`)}
        className="flex items-center gap-1.5 mb-4 group"
      >
        <h2 className="text-[19px] font-bold text-white cursor-pointer">{data.category}</h2>
        <span className="text-emerald-400 text-[30px] -translate-y-0.5 group-hover:translate-x-0.5 transition">›</span>
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.markets.map((market) => (
          <SmallMarketCard key={market.id} market={market} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export default function MarketsList() {
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get("category") ?? "";
  const urlSort     = searchParams.get("sort")     ?? "";
  const urlSearch   = searchParams.get("search")   ?? "";
  const apiSort     = urlSort === "breaking" ? "movers" : (urlSort || "volume");
  const isLiveSports = urlCategory === "Live Sports";

  const isHomeView = !urlCategory && !urlSearch;

  const [markets,     setMarkets]     = useState<Market[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);

  const [sections,        setSections]        = useState<CategorySectionData[]>([]);
  const [sectionsLoading, setSectionsLoading]  = useState(true);
  const [sectionsError,   setSectionsError]    = useState(false);

  const topRef        = useRef<HTMLDivElement>(null);
  const prevFilterRef = useRef({ category: urlCategory, sort: urlSort, search: urlSearch });

  // HOME VIEW — fetch a few markets per category, in parallel, then group by eventId.
  useEffect(() => {
    if (!isHomeView) return;

    let cancelled = false;
    setSectionsLoading(true);
    setSectionsError(false);

    Promise.all(
    CATEGORIES.map(async (category) => {
      const raw = await fetchCategoryMarkets(category, "volume");
      const items = raw.map((m) => ({ ...m, tags: m.tags ?? [] })) as ApiMarket[];
      const markets = groupMarketsByEvent(items).slice(0, HOME_SECTION_LIMIT);
      return { category, markets };
    })
  )
  .then((results) => {
    if (cancelled) return;
    setSections(results.filter((s) => s.markets.length > 0));
  })
  .catch(() => { if (!cancelled) setSectionsError(true); })
  .finally(() => { if (!cancelled) setSectionsLoading(false); });

      return () => { cancelled = true; };
    }, [isHomeView]);

  // CATEGORY / SEARCH VIEW — existing single paginated list, unchanged behavior.
  useEffect(() => {
    if (isHomeView) return;

    const filterChanged =
      prevFilterRef.current.category !== urlCategory ||
      prevFilterRef.current.sort     !== urlSort     ||
      prevFilterRef.current.search   !== urlSearch;

    prevFilterRef.current = { category: urlCategory, sort: urlSort, search: urlSearch };

    const pageToFetch = filterChanged ? 1 : currentPage;
    if (filterChanged && currentPage !== 1) setCurrentPage(1);

    if (isLiveSports) { setLoading(false); return; }

    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    params.set("page",  String(pageToFetch));
    params.set("limit", "20");
    params.set("sort",  apiSort);
    if (urlCategory) params.set("category", urlCategory);
    if (urlSearch)   params.set("search",   urlSearch);

    let cancelled = false;
    const isLiveCrypto = urlCategory === "Live Crypto";
    const fetchUrl = isLiveCrypto
      ? `${API_BASE}/api/markets/live-crypto?page=${pageToFetch}&limit=20`
      : `${API_BASE}/api/markets?${params}`;

    fetch(fetchUrl)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setMarkets(groupMarketsByEvent(data.items));
        setTotalPages(data.totalPages);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // apiSort is derived from urlSort so no need to include it separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHomeView, currentPage, urlCategory, urlSort, urlSearch]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelect = (marketId: string, optionLabel: string) => {
    console.log({ marketId, optionLabel });
  };

  if (isHomeView) {
    return (
      <div ref={topRef}>
        {sectionsLoading ? (
          CATEGORIES.map((c) => <SectionSkeleton key={c} />)
        ) : sectionsError ? (
          <div className="flex items-center justify-center py-16 text-center">
            <div>
              <p className="text-gray-400 text-sm">Couldn&apos;t load markets.</p>
              <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
            </div>
          </div>
        ) : (
          sections.map((section) => (
            <CategorySection key={section.category} data={section} onSelect={handleSelect} />
          ))
        )}
      </div>
    );
  }

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
              {urlCategory === "Live Crypto"
                ? "No live crypto markets right now."
                : urlSearch
                ? "No markets found for your search."
                : "No markets in this category."}
            </p>
            <p className="text-gray-600 text-xs mt-1">
              {urlCategory === "Live Crypto"
                ? "5-min and daily up/down markets appear here when they’re actively trading."
                : urlSearch
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

  if (isLiveSports) return <LiveSportsList />;

  return (
    <div ref={topRef}>
      {gridContent}
      {totalPages > 1 && (
        <PaginationBar current={currentPage} total={totalPages} onPage={goToPage} />
      )}
    </div>
  );
}
