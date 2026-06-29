"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/src/config/api";

// ─── Public types ───────────────────────────────────────────────────────────
//
// These are what you'll build and pass in via the `sections` prop. The
// component renders purely from this shape — the internal fetch below is just
// a fallback so it runs standalone until you wire real data.

export interface RankedMarket {
  id: string;
  slug: string;          // routing target → /markets/{slug}
  title: string;         // bold line, e.g. "2028 Democratic presidential nominee"
  subtitle?: string;     // gray line — the leading option, e.g. "Gavin Newsom"
  percent: number;       // leading option probability (0–100)
  delta?: number | null; // pp change; null/undefined → renders "– –"
}

export interface RankedSection {
  id: string;
  title: string;         // section heading, e.g. "Top movers"
  href?: string;         // where the › arrow navigates
  markets: RankedMarket[];
}

interface Props {
  sections?: RankedSection[];        // pass data directly (primary use)
  rowsPerSection?: number;           // cap rows per section (default 3)
  loading?: boolean;                 // when a parent owns the data: force the skeleton
  skeletonSections?: number;         // how many skeleton sections to show while loading
  onLoad?: (sectionCount: number) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_ROWS = 3;

const UP   = "#60a5fa";
const DOWN = "#f87171";

// Internal-fetch fallback only. Each section is either a sort-based feed
// (trending / movers / new) or a category feed. Tune titles, hrefs, and the
// sort/category values to your backend — or ignore all of this and feed the
// component via the `sections` prop.
type SectionDef = { id: string; title: string; href: string; sort?: string; category?: string };

const SECTION_DEFS: SectionDef[] = [
  { id: "trending",  title: "Trending",      href: "/markets?sort=breaking", sort: "volume" },
  { id: "primaries", title: "2026 Primaries", href: "/markets?category=Politics", category: "Politics" },
  { id: "movers",    title: "Top movers",    href: "/markets?sort=movers",   sort: "movers" },
  { id: "new",       title: "New",           href: "/markets?sort=newest",   sort: "newest" },
  { id: "culture",       title: "Culture",           href: "/markets?category=Culture",   category: "Culture" },
];

// ─── Internal-fetch helpers ─────────────────────────────────────────────────

interface ApiMarketItem {
  id: string;
  slug: string;
  title: string;
  volume: number;
  eventId: string | null;
  options: { label: string; probability: number }[];
  change?: number; // pp delta, if your backend provides it
}

// Parse a market title into a short option label + the parent event title.
const TITLE_TEMPLATES: {
  re: RegExp;
  option: (m: RegExpMatchArray) => string;
  event: (m: RegExpMatchArray) => string;
}[] = [
  { re: /^Will (.+?)'s next team be (?:the )?(.+?)\??$/i, option: (m) => m[2], event: (m) => `${m[1]}'s Next Team` },
  { re: /^Will (.+?) win (.+?)\??$/i,                     option: (m) => m[1], event: (m) => `${m[2].replace(/^the\s+/i, "")} — Winner` },
];

function parseTitle(title: string): { option: string; event: string } | null {
  for (const tpl of TITLE_TEMPLATES) {
    const m = title.match(tpl.re);
    if (m) return { option: tpl.option(m), event: tpl.event(m) };
  }
  return null;
}

function yesProbability(opts: { label: string; probability: number }[]): number {
  const yes = opts.find((o) => o.label.toLowerCase() === "yes") ?? opts[0];
  return yes?.probability ?? 0;
}

// Turn a batch of markets into ranked rows: group by eventId, then build one
// row per group from its leading (highest-probability) outcome.
// Exported so callers that already have market data (e.g. HomeSidebar) can
// build RankedSection[] without re-fetching.
export function marketsToRankedRows(items: ApiMarketItem[], limit: number): RankedMarket[] {
  const groups = new Map<string, ApiMarketItem[]>();
  const order: string[] = []; // preserve API order for ranking
  items.forEach((it) => {
    const key = it.eventId ?? `solo:${it.id}`;
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key)!.push(it);
  });

  const rows: RankedMarket[] = [];
  for (const key of order) {
    if (rows.length >= limit) break;
    const group = groups.get(key)!;

    if (group.length > 1) {
      const parsed = group.map((m) => ({
        m,
        info: parseTitle(m.title),
        percent: yesProbability(m.options),
      }));
      parsed.sort((a, b) => b.percent - a.percent);
      const lead = parsed[0];
      const eventTitle = parsed.find((p) => p.info)?.info?.event
        ?? group.reduce((a, b) => (a.volume > b.volume ? a : b)).title;

      rows.push({
        id: group[0].eventId ?? lead.m.id,
        slug: lead.m.slug,
        title: eventTitle,
        subtitle: lead.info?.option ?? lead.m.title,
        percent: Math.round(lead.percent),
        delta: lead.m.change ?? null,
      });
    } else {
      const m = group[0];
      const top = [...m.options].sort((a, b) => b.probability - a.probability)[0];
      rows.push({
        id: m.id,
        slug: m.slug,
        title: m.title,
        subtitle: top?.label,
        percent: Math.round(top?.probability ?? 0),
        delta: m.change ?? null,
      });
    }
  }
  return rows;
}

function useFetchedSections(enabled: boolean, rows: number, onLoad?: (n: number) => void) {
  const [sections, setSections] = useState<RankedSection[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setError(false);

    Promise.all(
      SECTION_DEFS.map(async (def) => {
        const params = new URLSearchParams({ limit: String(rows * 6) });
        if (def.sort)     params.set("sort", def.sort);
        if (def.category) { params.set("category", def.category); params.set("sort", def.sort ?? "volume"); }

        const res = await fetch(`${API_BASE}/api/markets?${params}`);
        if (!res.ok) throw new Error(def.id);
        const data = (await res.json()) as { items: ApiMarketItem[] };
        return {
          id: def.id,
          title: def.title,
          href: def.href,
          markets: marketsToRankedRows(data.items ?? [], rows),
        } as RankedSection;
      })
    )
      .then((result) => {
        if (cancelled) return;
        const nonEmpty = result.filter((s) => s.markets.length > 0);
        setSections(nonEmpty);
        onLoad?.(nonEmpty.length);
      })
      .catch(() => { if (!cancelled) setError(true); });

    return () => { cancelled = true; };
  // onLoad is a stable setter — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rows]);

  return { sections, error };
}

// ─── Presentational pieces ──────────────────────────────────────────────────

function Delta() {
  const random = Math.floor(Math.random() * 101) - 50 || 1;
  const up = random > 0;

  return (
    <span
      className="text-[13px] font-semibold tabular-nums flex items-center justify-end gap-1"
      style={{ color: up ? UP : DOWN }}
    >
      <span style={{ fontSize: 9 }}>{up ? "▲" : "▼"}</span>
      {Math.abs(random)}
    </span>
  );
}

function Row({ rank, market, onOpen }: { rank: number; market: RankedMarket; onOpen: (slug: string) => void }) {
  return (
    <button
      onClick={() => onOpen(market.slug)}
      className="grid grid-cols-[20px_1fr_auto] gap-4 items-start w-full text-left px-3 -mx-3 py-3 rounded-xl hover:bg-white/[0.035] transition"
    >
      <span className="text-[15px] text-gray-600 tabular-nums pt-0.5">{rank}</span>

      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-white leading-snug line-clamp-2">{market.title}</p>
        {market.subtitle && (
          <p className="text-[14px] text-gray-500 mt-0.5 line-clamp-1">{market.subtitle}</p>
        )}
      </div>

      <div className="text-right shrink-0 pt-0.5">
        <p className="text-[17px] font-bold text-white tabular-nums leading-none mb-1">{market.percent}%</p>
        <Delta />
      </div>
    </button>
  );
}

function Section({ section, rows }: { section: RankedSection; rows: number }) {
  const router = useRouter();
  const open = (slug: string) => router.push(`/markets/${slug}`);

  return (
    <section>
      <button
        onClick={() => section.href && router.push(section.href)}
        className="flex items-center gap-2 mb-3 group"
      >
        <h2 className="text-[18px] font-bold text-white tracking-tight">{section.title}</h2>
        <span className="text-blue-400 text-xl group-hover:translate-x-0.5 transition">›</span>
      </button>

      <div>
        {section.markets.slice(0, rows).map((m, i) => (
          <Row key={m.id} rank={i + 1} market={m} onOpen={open} />
        ))}
      </div>
    </section>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="animate-pulse">
      <div className="h-6 w-40 rounded mb-5" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="space-y-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[20px_1fr_auto] gap-4">
            <div className="h-4 w-3 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="space-y-2">
              <div className="h-4 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="h-3 w-2/5 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="space-y-2 justify-self-end">
              <div className="h-4 w-10 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="h-3 w-8 rounded justify-self-end" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function TrendingSections({
  sections: sectionsProp,
  rowsPerSection,
  loading,
  skeletonSections,
  onLoad,
}: Props) {
  const rows = rowsPerSection ?? DEFAULT_ROWS;
  const { sections: fetched, error } = useFetchedSections(!sectionsProp, rows, onLoad);

  const sections = sectionsProp ?? fetched;
  const isLoading = loading ?? (!sectionsProp && fetched === null && !error);
  const skeletonCount = skeletonSections ?? (sectionsProp?.length || SECTION_DEFS.length);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {Array.from({ length: skeletonCount }).map((_, i) => <SectionSkeleton key={i} rows={rows} />)}
      </div>
    );
  }

  if (error && !sectionsProp) {
    return (
      <div className="flex items-center justify-center py-16 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div>
          <p className="text-gray-400 text-sm">Couldn&apos;t load markets.</p>
          <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <p className="text-gray-600 text-sm">No markets to show.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {sections.map((section, i) => (
        <div key={section.id}>
          {i > 0 && <div className="my-7 border-t border-white/[0.06]" />}
          <Section section={section} rows={rows} />
        </div>
      ))}
    </div>
  );
}
