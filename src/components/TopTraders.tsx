"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { Trader } from "@/types/trader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── API shape ────────────────────────────────────────────────────────────────

interface ApiTraderItem {
  slug: string;
  name: string | null;
  avatar: string;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  followers: number;
  totalTrades: number;
}

function formatPnl(usdc: number): string {
  const sign = usdc >= 0 ? "+" : "-";
  const abs = Math.abs(usdc);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString()}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function mapApiTrader(t: ApiTraderItem, rank: number): Trader {
  return {
    rank,
    name:       t.name ?? t.slug,
    handle:     `@${t.slug}`,
    avatar:     t.avatar,
    pnl:        formatPnl(t.totalPnl),
    pnlPercent: Math.round(t.totalPnlPercent),
    winRate:    Math.round(t.winRate),
    followers:  formatFollowers(t.followers),
    isUp:       t.totalPnl >= 0,
  };
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#8b5cf6,#d946ef)",
  "linear-gradient(135deg,#14b8a6,#0ea5e9)",
];

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

function TraderRow({ trader, idx }: { trader: Trader; idx: number }) {
  const avatarGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const slug = trader.handle.replace("@", "");

  return (
    <Link
        href={`/traders/${slug}`}
        className="relative flex items-center gap-2.5 py-2.5 group cursor-pointer rounded-lg px-2 transition-all duration-300 my-2 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]"
        style={
            trader.rank === 1
                ? {
                    border: "1px solid rgba(99,102,241,.35)",
                    background:
                    "linear-gradient(135deg, rgba(99,102,241,.18), rgba(139,92,246,.08))",
                    boxShadow:
                    "0 0 24px rgba(99,102,241,.12), inset 0 1px 0 rgba(255,255,255,.04)",
                }
                : trader.rank === 2
                ? {
                    border: "1px solid rgba(6,182,212,.30)",
                    background:
                    "linear-gradient(135deg, rgba(6,182,212,.14), rgba(14,165,233,.05))",
                    boxShadow:
                    "0 0 20px rgba(6,182,212,.08), inset 0 1px 0 rgba(255,255,255,.03)",
                }
                : trader.rank === 3
                ? {
                    border: "1px solid rgba(236,72,153,.30)",
                    background:
                    "linear-gradient(135deg, rgba(236,72,153,.14), rgba(168,85,247,.05))",
                    boxShadow:
                    "0 0 20px rgba(236,72,153,.08), inset 0 1px 0 rgba(255,255,255,.03)",
                }
                : {
                    borderBottom: "1px solid rgba(255,255,255,.04)",
                }
            }
        >
      <span
        className="text-[10px] w-3 shrink-0 font-semibold tabular-nums"
        style={{
            color:
                trader.rank === 1
                ? "#818cf8"
                : trader.rank === 2
                ? "#22d3ee"
                : trader.rank === 3
                ? "#f472b6"
                : "#4b5563",
        }}
      >
        {trader.rank === 1 && (
        <div className="absolute -top-2 left-4 w-10 h-10 flex items-center justify-center transform -rotate-12 origin-top-left">
            <span className="text-xl leading-none drop-shadow">
            👑
            </span>
        </div>
        )}
        {trader.rank}
      </span>
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: avatarGrad }}
      >
        {trader.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate leading-none">
          {trader.name}
        </div>
        <div className="text-[10px] text-gray-600 truncate mt-0.5">{trader.handle}</div>
      </div>
      <div className="text-right shrink-0">
        <div
          className="flex items-center justify-end gap-0.5 text-[12px] font-bold tabular-nums"
          style={{ color: trader.isUp ? "#34d399" : "#f87171" }}
        >
          {trader.isUp ? <TrendUp /> : <TrendDown />}
          {trader.pnl}
        </div>
        <div className="text-[10px] text-gray-600 mt-0.5 tabular-nums">{trader.winRate}% win</div>
      </div>
    </Link>
  );
}

export default function TopTraders() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef   = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const abortRef  = useRef<AbortController | null>(null);

  const [query,         setQuery]         = useState("");
  const [traders,       setTraders]       = useState<Trader[]>([]);
  const [searchResults, setSearchResults] = useState<Trader[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Top-20 load (unchanged) ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/traders?limit=20&sortBy=pnl`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.traders) return;
        const items = (data.traders as ApiTraderItem[])
          .filter((t) => t.totalTrades > 0)
          .map((t, i) => mapApiTrader(t, i + 1));
        setTraders(items);
      })
      .catch(() => {});
  }, []);

  // ── Debounced backend search ──────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();

    if (!q) {
      abortRef.current?.abort();
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const id = setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      fetch(
        `${API_BASE}/api/traders?search=${encodeURIComponent(q)}&limit=8&sortBy=pnl`,
        { signal }
      )
        .then((r) => (r.ok ? r.json() : { traders: [] }))
        .then((data: { traders: ApiTraderItem[] }) => {
          setSearchResults((data.traders ?? []).map((t, i) => mapApiTrader(t, i + 1)));
          setSearchLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setSearchResults([]);
            setSearchLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const doubled = useMemo(() => [...traders, ...traders], [traders]);

  // ── Auto-scroll (top-20 list, independent of search) ─────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || traders.length === 0) return;

    let pos = 0;
    const speed = 0.4;

    const tick = () => {
      if (!pausedRef.current && el) {
        pos += speed;
        if (pos >= el.scrollHeight / 2) pos = 0;
        el.scrollTop = pos;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [traders]);

  const showDropdown = query.trim().length > 0;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 13 }}>🏆</span>
            <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Top Traders</span>
          </div>
          <Link href="/all-traders">
            <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
              All →
            </button>
          </Link>
        </div>

        {/* Search input + dropdown overlay */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            width="11" height="11" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traders…"
            className="w-full pl-7 pr-7 py-1.5 rounded-lg text-[11px] text-gray-200 placeholder-gray-600 outline-none border border-white/[0.08] focus:border-white/[0.15] transition-colors"
            style={{ background: "#0e0f11" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-[11px]"
            >
              ✕
            </button>
          )}

          {/* Dropdown — overlays the list, does not replace it */}
          {showDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              style={{ background: "#0e0f11" }}
            >
              {searchLoading ? (
                <div className="text-[11px] text-gray-600 text-center py-3">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="text-[11px] text-gray-600 text-center py-3">No traders found</div>
              ) : (
                <div className="max-h-[280px] overflow-y-auto px-1" style={{ scrollbarWidth: "none" }}>
                  {searchResults.map((trader, idx) => (
                    <TraderRow key={`${trader.handle}-${idx}`} trader={trader} idx={idx} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top-20 auto-scrolling list — always visible, always independent of search */}
      {traders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] text-gray-700">Loading…</span>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-hidden flex-1 min-h-0"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          style={{ minHeight: 0 }}
        >
          {doubled.map((trader, idx) => (
            <TraderRow key={`${trader.rank}-${idx}`} trader={trader} idx={trader.rank - 1} />
          ))}
        </div>
      )}

    </div>
  );
}
