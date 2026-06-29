"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TraderProfile } from "@/types/Traderprofile";
import { gradientByIndex } from "@/src/constants/avatarGradients";

// ─── Sidebar data ─────────────────────────────────────────────────────────────

const LIVE_MARKETS = [
  { id: 1, title: "Will the Knicks win the 2026 NBA Finals?",        category: "Sports",   yes: 79, volume: "$8.1M", hot: true  },
  { id: 2, title: "Will Fed hold rates in June 2026?",               category: "Finance",  yes: 64, volume: "$13M",  hot: true  },
  { id: 3, title: "Will BTC close above $110K by July?",             category: "Crypto",   yes: 41, volume: "$4.2M", hot: false },
  { id: 4, title: "Will Nvidia hit $200 by Q3 2026?",                category: "Finance",  yes: 48, volume: "$2.8M", hot: false },
  { id: 5, title: "SpaceX Starship orbital flight before July?",     category: "Tech",     yes: 38, volume: "$1.6M", hot: false },
  { id: 6, title: "Will Taylor Swift announce Eras Tour 2027?",      category: "Culture",  yes: 55, volume: "$900K", hot: false },
];

const PLATFORM_STATS = [
  { label: "Active Traders",  value: "24,180",  sub: "+12% this week",  color: "#60a5fa" },
  { label: "Total Volume",    value: "$142M",   sub: "all time",        color: "#60a5fa" },
  { label: "Markets Open",    value: "1,847",   sub: "across 6 cats",   color: "#facc15" },
  { label: "Avg Win Rate",    value: "61%",     sub: "top 100 traders", color: "#a78bfa" },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Sports:  { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  Finance: { bg: "rgba(234,179,8,0.12)",   text: "#facc15" },
  Crypto:  { bg: "rgba(16,185,129,0.12)",  text: "#60a5fa" },
  Politics:{ bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  Tech:    { bg: "rgba(251,146,60,0.12)",  text: "#fb923c" },
  Culture: { bg: "rgba(236,72,153,0.12)",  text: "#f472b6" },
};

const TIER_CONFIG = {
  bronze:  { label: "Bronze",  color: "#cd7f32", bg: "rgba(205,127,50,0.12)"  },
  silver:  { label: "Silver",  color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  gold:    { label: "Gold",    color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  diamond: { label: "Diamond", color: "#67e8f9", bg: "rgba(103,232,249,0.12)" },
};

type SortKey = "pnl" | "winRate" | "totalTrades" | "followers";
type ViewMode = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrendUp() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M2 9l3.5-3.5L7.5 7.5 10 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrendDown() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M2 3l3.5 3.5L7.5 4.5 10 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Trader Grid Card ─────────────────────────────────────────────────────────

function TraderGridCard({ trader, rank }: { trader: TraderProfile; rank: number }) {
  const isUp = trader.totalPnlPercent >= 0;
  const tier = TIER_CONFIG[trader.tier];
  const avatarGrad = gradientByIndex(rank);

  return (
    <Link
      href={`/traders/${trader.slug}`}
      className="group block rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 overflow-hidden"
      style={{ background: "#0e0f11" }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: isUp ? "linear-gradient(90deg,#6366f1,#60a5fa)" : "linear-gradient(90deg,#f87171,#f43f5e)" }} />

      <div className="px-4 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Rank */}
            <span
              className="text-[11px] font-black tabular-nums w-5 text-center"
              style={{ color: rank <= 3 ? "#facc15" : "#374151" }}
            >
              #{rank}
            </span>
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0"
              style={{ background: avatarGrad }}
            >
              {trader.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold text-white group-hover:text-indigo-300 transition-colors leading-none">
                  {trader.name}
                </span>
                {trader.isVerified && (
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#6366f1"/>
                    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">{trader.handle}</div>
            </div>
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: tier.bg, color: tier.color }}
          >
            {tier.label}
          </span>
        </div>

        {/* PnL big number */}
        <div className="mb-3">
          <div
            className="text-[20px] font-black tabular-nums leading-none flex items-center gap-1"
            style={{ color: isUp ? "#60a5fa" : "#f87171" }}
          >
            {isUp ? <TrendUp /> : <TrendDown />}
            {trader.totalPnl}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">{isUp ? "+" : ""}{trader.totalPnlPercent}% ROI</div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.05]">
          <div>
            <div className="text-[11px] font-bold text-white tabular-nums">{trader.winRate}%</div>
            <div className="text-[9px] text-gray-600 mt-0.5">Win rate</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white tabular-nums">{trader.totalTrades}</div>
            <div className="text-[9px] text-gray-600 mt-0.5">Trades</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white tabular-nums">{trader.streak}W</div>
            <div className="text-[9px] text-gray-600 mt-0.5">Streak</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Trader List Row ──────────────────────────────────────────────────────────

function TraderListRow({ trader, rank }: { trader: TraderProfile; rank: number }) {
  const isUp = trader.totalPnlPercent >= 0;
  const tier = TIER_CONFIG[trader.tier];
  const avatarGrad = gradientByIndex(rank);

  return (
    <Link
      href={`/traders/${trader.slug}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.02] transition-all group"
      style={{ background: "#0e0f11" }}
    >
      {/* Rank */}
      <span
        className="text-[11px] font-black w-5 shrink-0 tabular-nums text-center"
        style={{ color: rank <= 3 ? "#facc15" : "#374151" }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
        style={{ background: avatarGrad }}
      >
        {trader.avatar}
      </div>

      {/* Name */}
      <div className="w-36 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate">
            {trader.name}
          </span>
          {trader.isVerified && (
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="10" fill="#6366f1"/>
              <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className="text-[10px] text-gray-600">{trader.handle}</div>
      </div>

      {/* Tier */}
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 w-16 text-center"
        style={{ background: tier.bg, color: tier.color }}
      >
        {tier.label}
      </span>

      {/* PnL */}
      <div className="flex-1 text-right">
        <div
          className="text-[14px] font-black tabular-nums flex items-center justify-end gap-0.5"
          style={{ color: isUp ? "#60a5fa" : "#f87171" }}
        >
          {isUp ? <TrendUp /> : <TrendDown />}
          {trader.totalPnl}
        </div>
      </div>

      {/* ROI */}
      <div className="w-16 text-right shrink-0">
        <div className="text-[11px] font-semibold tabular-nums" style={{ color: isUp ? "#60a5fa" : "#f87171" }}>
          {isUp ? "+" : ""}{trader.totalPnlPercent}%
        </div>
        <div className="text-[9px] text-gray-600">ROI</div>
      </div>

      {/* Win rate */}
      <div className="w-14 text-right shrink-0">
        <div className="text-[11px] font-semibold text-white tabular-nums">{trader.winRate}%</div>
        <div className="text-[9px] text-gray-600">Win</div>
      </div>

      {/* Trades */}
      <div className="w-12 text-right shrink-0">
        <div className="text-[11px] font-semibold text-white tabular-nums">{trader.totalTrades}</div>
        <div className="text-[9px] text-gray-600">Trades</div>
      </div>

      {/* Volume */}
      <div className="w-16 text-right shrink-0">
        <div className="text-[11px] font-semibold text-white tabular-nums">{trader.volumeTraded}</div>
        <div className="text-[9px] text-gray-600">Volume</div>
      </div>
    </Link>
  );
}

// ─── Sidebar: Live Markets ────────────────────────────────────────────────────

function LiveMarketsCard() {
  return (
    <div
      className="rounded-2xl border border-white/[0.07] px-4 py-4"
      style={{ background: "#111214" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", letterSpacing: "0.05em" }}
          >
            LIVE
          </span>
          <span className="text-[12px] font-semibold text-gray-200">Markets</span>
        </div>
        <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">All →</button>
      </div>

      <div className="space-y-2">
        {LIVE_MARKETS.map((m) => {
          const cat = categoryColors[m.category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
          return (
            <div
              key={m.id}
              className="rounded-xl px-3 py-2.5 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer group transition-all"
              style={{ background: "#0e0f11" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-white transition-colors leading-snug line-clamp-2 flex-1">
                  {m.title}
                </p>
                {m.hot && (
                  <span className="text-[9px] shrink-0" style={{ color: "#f97316" }}>🔥</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: cat.bg, color: cat.text }}
                >
                  {m.category}
                </span>
                {/* Yes bar */}
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${m.yes}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)" }} />
                </div>
                <span className="text-[10px] font-bold text-white tabular-nums shrink-0">{m.yes}%</span>
                <span className="text-[10px] text-gray-600 shrink-0">{m.volume}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar: Platform Stats ──────────────────────────────────────────────────

function PlatformStatsCard() {
  return (
    <div
      className="rounded-2xl border border-white/[0.07] px-4 py-4"
      style={{ background: "#111214" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ fontSize: 13 }}>📊</span>
        <span className="text-[12px] font-semibold text-gray-200">Platform Stats</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORM_STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-3 py-2.5 border border-white/[0.04]"
            style={{ background: "#0e0f11" }}
          >
            <div className="text-[16px] font-black leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-semibold text-gray-400 mt-1">{s.label}</div>
            <div className="text-[9px] text-gray-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar: Top Earner Spotlight ───────────────────────────────────────────

function SpotlightCard({ topTrader }: { topTrader: TraderProfile }) {
  return (
    <div
      className="rounded-2xl border border-white/[0.07] px-4 py-4 relative overflow-hidden"
      style={{ background: "#111214" }}
    >
      {/* Glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: "#6366f1" }}
      />
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ fontSize: 13 }}>⚡</span>
        <span className="text-[12px] font-semibold text-gray-200">Top Earner</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(103,232,249,0.12)", color: "#67e8f9" }}>
          This Month
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          {topTrader.avatar}
        </div>
        <div>
          <div className="text-[14px] font-black text-white">{topTrader.name}</div>
          <div className="text-[10px] text-gray-600">{topTrader.handle}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[13px] font-black" style={{ color: "#60a5fa" }}>{topTrader.totalPnl}</div>
          <div className="text-[9px] text-gray-600 mt-0.5">Total PnL</div>
        </div>
        <div>
          <div className="text-[13px] font-black text-white">{topTrader.winRate}%</div>
          <div className="text-[9px] text-gray-600 mt-0.5">Win Rate</div>
        </div>
        <div>
          <div className="text-[13px] font-black text-white">{topTrader.streak}W</div>
          <div className="text-[9px] text-gray-600 mt-0.5">Streak</div>
        </div>
      </div>
      <Link
        href={`/traders/${topTrader.slug}`}
        className="mt-3 block w-full py-2 text-center text-[11px] font-bold rounded-xl transition-all"
        style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        View Profile →
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  traders: TraderProfile[];
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pnl",         label: "PnL"        },
  { key: "winRate",     label: "Win Rate"   },
  { key: "totalTrades", label: "Trades"     },
  { key: "followers",   label: "Followers"  },
];

const TIER_FILTERS = ["All", "Diamond", "Gold", "Silver", "Bronze"] as const;

const PAGE_SIZE = 15;

export default function TradersPageClient({ traders }: Props) {
  const [query, setQuery]       = useState("");
  const [sortBy, setSortBy]     = useState<SortKey>("pnl");
  const [tierFilter, setTier]   = useState<string>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage]         = useState(1);

  const setQueryR  = (v: string)  => { setQuery(v);  setPage(1); };
  const setSortByR = (v: SortKey) => { setSortBy(v); setPage(1); };
  const setTierR   = (v: string)  => { setTier(v);   setPage(1); };

  const sorted = useMemo(() => {
    let list = [...traders];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.handle.toLowerCase().includes(q));
    }

    if (tierFilter !== "All") {
      list = list.filter((t) => t.tier === tierFilter.toLowerCase());
    }

    list.sort((a, b) => {
      if (sortBy === "pnl")         return b.totalPnlRaw - a.totalPnlRaw;
      if (sortBy === "winRate")     return b.winRate - a.winRate;
      if (sortBy === "totalTrades") return b.totalTrades - a.totalTrades;
      if (sortBy === "followers")   return b.followers - a.followers;
      return 0;
    });

    return list;
  }, [traders, query, sortBy, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe   = Math.min(page, totalPages);
  const pageSlice  = sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const rankOffset = (pageSafe - 1) * PAGE_SIZE;

  const topTrader = traders.reduce((best, t) =>
    t.totalPnlRaw > best.totalPnlRaw ? t : best
  );

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-black text-white leading-none">Traders</h1>
          <p className="text-[13px] text-gray-500 mt-1">{traders.length} traders ranked by performance</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">

              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQueryR(e.target.value)}
                  placeholder="Search traders…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] text-gray-200 placeholder-gray-600 outline-none border border-white/[0.08] focus:border-white/[0.15] transition-colors"
                  style={{ background: "#111214" }}
                />
              </div>

              {/* Tier filter pills */}
              <div className="flex gap-1 mx-auto">
                {TIER_FILTERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierR(t)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={
                      tierFilter === t
                        ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }
                        : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid transparent" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex gap-1 mx-auto md:ml-auto">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setSortByR(o.key)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={
                      sortBy === o.key
                        ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
                        : { background: "transparent", color: "#4b5563", border: "1px solid transparent" }
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-1.5 rounded-md transition-all hidden md:block"
                  style={{ background: viewMode === "grid" ? "rgba(255,255,255,0.08)" : "transparent", color: viewMode === "grid" ? "#fff" : "#4b5563" }}
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-1.5 rounded-md transition-all hidden md:block"
                  style={{ background: viewMode === "list" ? "rgba(255,255,255,0.08)" : "transparent", color: viewMode === "list" ? "#fff" : "#4b5563" }}
                >
                  <ListIcon />
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-[11px] text-gray-600 mb-3">
              Showing {rankOffset + 1}–{Math.min(rankOffset + PAGE_SIZE, sorted.length)} of {sorted.length} trader{sorted.length !== 1 ? "s" : ""}
            </div>

            {/* Grid or List */}
            {sorted.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-[13px]">No traders match your search</div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pageSlice.map((trader, i) => (
                  <TraderGridCard key={trader.slug} trader={trader} rank={rankOffset + i + 1} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-4 py-1.5 text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                  <span className="w-5 shrink-0">#</span>
                  <span className="w-8 shrink-0" />
                  <span className="w-36 shrink-0">Trader</span>
                  <span className="w-16 shrink-0">Tier</span>
                  <span className="flex-1 text-right">PnL</span>
                  <span className="w-16 text-right shrink-0">ROI</span>
                  <span className="w-14 text-right shrink-0">Win</span>
                  <span className="w-12 text-right shrink-0">Trades</span>
                  <span className="w-16 text-right shrink-0">Volume</span>
                </div>
                {pageSlice.map((trader, i) => (
                  <TraderListRow key={trader.slug} trader={trader} rank={rankOffset + i + 1} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
                {/* Prev */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === pageSafe;
                    const isNear   = Math.abs(p - pageSafe) <= 1 || p === 1 || p === totalPages;
                    if (!isNear) {
                      // Show ellipsis once between gaps
                      if (p === 2 || p === totalPages - 1) {
                        return <span key={p} className="text-[11px] text-gray-600 px-1">…</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-7 h-7 rounded-lg text-[12px] font-semibold transition-all"
                        style={
                          isActive
                            ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" }
                            : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid transparent" }
                        }
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  Next
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="hidden md:block w-[240px] shrink-0 flex flex-col gap-4 sticky top-6">
            <SpotlightCard topTrader={topTrader} />
            <LiveMarketsCard />
            <PlatformStatsCard />
          </aside>

        </div>
      </div>
    </div>
  );
}
