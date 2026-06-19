import Link from "next/link";
import type { ReactNode } from "react";

// ─── API shapes ───────────────────────────────────────────────────────────────

interface ApiMarket {
  title: string;
  volume: number;
  options: { label: string; probability: number }[];
  tags: string[];
}

interface ApiEvent {
  title: string;
  tags: string[];
  markets: { volume: number }[];
}

interface CategoryItem {
  tag: string;
  volume: number;
  marketCount: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  markets: ApiMarket[];
  events: ApiEvent[];
  categories: CategoryItem[];
  breakingMarkets: ApiMarket[];
}

// ─── Category metadata ────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; text: string }> = {
  Sports:    { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  Crypto:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
  Politics:  { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  Elections: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  Culture:   { bg: "rgba(236,72,153,0.12)",  text: "#f472b6" },
  Tech:      { bg: "rgba(251,146,60,0.12)",  text: "#fb923c" },
  AI:        { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee" },
};

const categoryIcons: Record<string, string> = {
  Sports:    "🏀",
  Crypto:    "₿",
  Politics:  "🗳️",
  Elections: "🗳️",
  Culture:   "🎭",
  Tech:      "🚀",
  AI:        "🤖",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function eventBadge(tag?: string): string {
  const map: Record<string, string> = {
    Sports:    "🏀 LIVE",
    Crypto:    "₿ LIVE",
    Politics:  "🗳️ LIVE",
    Elections: "🗳️ LIVE",
    Tech:      "🚀 LIVE",
    Culture:   "🎭 LIVE",
    AI:        "🤖 LIVE",
  };
  return map[tag ?? ""] ?? "⚡ LIVE";
}

// ─── Tiny SVGs ────────────────────────────────────────────────────────────────

function ArrowUp() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-white/[0.07] px-4 py-4"
      style={{ background: "#111214", fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SeeAllLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
      All →
    </Link>
  );
}

// ─── Card 1: Breaking (live from API, sort=movers) ───────────────────────────

export function BreakingCard({ markets }: { markets: ApiMarket[] }) {
  const items = markets.slice(0, 3);
  return (
    <Card>
      <CardHeader action={<SeeAllLink href="/?sort=movers" />}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Breaking</span>
      </CardHeader>

      <div className="divide-y divide-white/[0.04]">
        {items.map((item, i) => {
          const yes = item.options[0]?.probability ?? 0;
          return (
            <div key={i} className="flex items-start gap-2.5 py-3 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-3 shrink-0 pt-0.5 font-medium tabular-nums">{i + 1}</span>
              <p className="flex-1 text-[12px] text-gray-400 leading-snug group-hover:text-gray-200 transition-colors line-clamp-2 min-w-0">
                {item.title}
              </p>
              <div className="shrink-0 text-right ml-1">
                <div className="text-[13px] font-bold text-white tabular-nums">{yes}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 2: Hot Topics (real from /api/categories/volume) ───────────────────

export function HotTopicsCard({ categories }: { categories: CategoryItem[] }) {
  const items = categories.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <span style={{ fontSize: 13 }}>🔥</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Hot Topics</span>
      </CardHeader>

      {items.length === 0 ? (
        <p className="text-[11px] text-gray-700 py-3 text-center">No data available</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {items.map((cat, i) => {
            const colors = categoryColors[cat.tag] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
            return (
              <Link
                key={cat.tag}
                href={`/?category=${cat.tag}`}
                className="flex items-center gap-2.5 py-2.5 group cursor-pointer"
              >
                <span className="text-[10px] text-gray-700 w-3 shrink-0 font-medium tabular-nums">{i + 1}</span>
                <span className="flex-1 text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {cat.tag}
                </span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {cat.tag}
                </span>
                <span className="text-[11px] text-gray-600 shrink-0 tabular-nums">
                  {formatVolume(cat.volume)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Card 3: Live Events (live from API) ──────────────────────────────────────

export function LiveEventsCard({ events }: { events: ApiEvent[] }) {
  const items = events.slice(0, 3);
  return (
    <Card>
      <CardHeader>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", letterSpacing: "0.05em" }}
        >
          LIVE
        </span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Live Events</span>
      </CardHeader>

      <div className="space-y-2">
        {items.map((ev, i) => {
          const vol = formatVolume(ev.markets.reduce((s, m) => s + (m.volume ?? 0), 0));
          const badge = eventBadge(ev.tags[0]);
          return (
            <div
              key={i}
              className="rounded-xl px-3 py-2.5 group cursor-pointer hover:bg-white/[0.03] transition-colors border border-white/[0.04]"
              style={{ background: "#0e0f11" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition-colors leading-snug flex-1 min-w-0 line-clamp-1">
                  {ev.title}
                </p>
                <span className="text-[10px] font-medium shrink-0" style={{ color: "#f87171" }}>
                  {badge}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-semibold ml-auto" style={{ color: "#34d399" }}>{vol}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 4: Trending Markets (live from API) ─────────────────────────────────

export function TrendingMarketsCard({ markets }: { markets: ApiMarket[] }) {
  const items = markets.slice(0, 4);
  return (
    <Card>
      <CardHeader action={<SeeAllLink href="/?sort=volume" />}>
        <span style={{ fontSize: 13 }}>📈</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Trending</span>
      </CardHeader>

      <div className="divide-y divide-white/[0.04]">
        {items.map((m, i) => {
          const category = m.tags[0] ?? "General";
          const yes = m.options[0]?.probability ?? 0;
          const cat = categoryColors[category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
          return (
            <div key={i} className="py-2.5 group cursor-pointer">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-[12px] text-gray-400 group-hover:text-gray-200 transition-colors leading-snug line-clamp-1 min-w-0">
                  {m.title}
                </p>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: cat.bg, color: cat.text }}
                >
                  {category}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${yes}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)" }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-white tabular-nums">{yes}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 5: Top Categories (real from /api/categories/volume) ────────────────

export function TopCategoriesCard({ categories }: { categories: CategoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <span style={{ fontSize: 13 }}>🗂️</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Top Categories</span>
      </CardHeader>

      {categories.length === 0 ? (
        <p className="text-[11px] text-gray-700 py-3 text-center">No data available</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const colors = categoryColors[cat.tag] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
            const icon = categoryIcons[cat.tag] ?? "⚡";
            return (
              <Link
                key={cat.tag}
                href={`/?category=${cat.tag}`}
                className="flex flex-col items-start px-3 py-2.5 rounded-xl border border-white/[0.05] hover:border-white/10 transition-all text-left group"
                style={{ background: colors.bg }}
              >
                <span className="text-lg leading-none mb-1.5">{icon}</span>
                <span className="text-[12px] font-bold" style={{ color: colors.text }}>
                  {cat.tag}
                </span>
                <span className="text-[10px] text-gray-600 mt-0.5">{cat.marketCount} markets</span>
                <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{formatVolume(cat.volume)} vol</span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Default export: all cards stacked ───────────────────────────────────────

export default function HomeSidebar({ markets, events, categories, breakingMarkets }: Props) {
  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <BreakingCard markets={breakingMarkets} />
      <HotTopicsCard categories={categories} />
      <LiveEventsCard events={events} />
      <TrendingMarketsCard markets={markets} />
      <TopCategoriesCard categories={categories} />
    </div>
  );
}
