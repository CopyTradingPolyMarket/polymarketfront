"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { Trader } from "@/types/trader";

const TOP_TRADERS: Trader[] = [
  { rank: 1,  name: "Marcus V.",    handle: "@marcusv",   pnl: "+$48,200", pnlPercent: 312, winRate: 78, followers: "12.4K", avatar: "MV", isUp: true  },
  { rank: 2,  name: "Priya S.",     handle: "@priyaseth", pnl: "+$31,700", pnlPercent: 218, winRate: 74, followers: "9.1K",  avatar: "PS", isUp: true  },
  { rank: 3,  name: "Jake R.",      handle: "@jaker",     pnl: "+$27,400", pnlPercent: 189, winRate: 71, followers: "7.8K",  avatar: "JR", isUp: true  },
  { rank: 4,  name: "Cleo M.",      handle: "@cleom",     pnl: "+$19,900", pnlPercent: 143, winRate: 68, followers: "5.3K",  avatar: "CM", isUp: true  },
  { rank: 5,  name: "Tom W.",       handle: "@tomw",      pnl: "+$14,600", pnlPercent: 97,  winRate: 65, followers: "4.0K",  avatar: "TW", isUp: true  },
  { rank: 6,  name: "Niko B.",      handle: "@nikob",     pnl: "+$9,300",  pnlPercent: 61,  winRate: 63, followers: "3.1K",  avatar: "NB", isUp: true  },
  { rank: 7,  name: "Emma K.",      handle: "@emmak",     pnl: "+$8,700",  pnlPercent: 58,  winRate: 62, followers: "2.9K",  avatar: "EK", isUp: true  },
  { rank: 8,  name: "Lucas T.",     handle: "@lucast",    pnl: "+$7,900",  pnlPercent: 54,  winRate: 61, followers: "2.6K",  avatar: "LT", isUp: true  },
  { rank: 9,  name: "Sophia G.",    handle: "@sophiag",   pnl: "+$7,100",  pnlPercent: 49,  winRate: 60, followers: "2.4K",  avatar: "SG", isUp: true  },
  { rank: 10, name: "Daniel H.",    handle: "@danh",      pnl: "+$6,500",  pnlPercent: 44,  winRate: 59, followers: "2.1K",  avatar: "DH", isUp: true  },
  { rank: 11, name: "Olivia P.",    handle: "@oliviap",   pnl: "+$5,800",  pnlPercent: 40,  winRate: 58, followers: "1.9K",  avatar: "OP", isUp: true  },
  { rank: 12, name: "Ryan J.",      handle: "@ryanj",     pnl: "+$5,100",  pnlPercent: 35,  winRate: 57, followers: "1.8K",  avatar: "RJ", isUp: true  },
  { rank: 13, name: "Mia D.",       handle: "@miad",      pnl: "+$4,600",  pnlPercent: 31,  winRate: 56, followers: "1.6K",  avatar: "MD", isUp: true  },
  { rank: 14, name: "Ethan F.",     handle: "@ethanf",    pnl: "+$4,100",  pnlPercent: 28,  winRate: 55, followers: "1.5K",  avatar: "EF", isUp: true  },
  { rank: 15, name: "Ava C.",       handle: "@avac",      pnl: "+$3,800",  pnlPercent: 25,  winRate: 54, followers: "1.4K",  avatar: "AC", isUp: true  },
  { rank: 16, name: "Noah Z.",      handle: "@noahz",     pnl: "+$3,200",  pnlPercent: 22,  winRate: 53, followers: "1.2K",  avatar: "NZ", isUp: true  },
  { rank: 17, name: "Liam Q.",      handle: "@liamq",     pnl: "+$2,700",  pnlPercent: 18,  winRate: 52, followers: "1.1K",  avatar: "LQ", isUp: true  },
  { rank: 18, name: "Sara L.",      handle: "@saral",     pnl: "-$2,100",  pnlPercent: -14, winRate: 52, followers: "2.2K",  avatar: "SL", isUp: false },
  { rank: 19, name: "Kevin M.",     handle: "@kevinm",    pnl: "-$3,800",  pnlPercent: -21, winRate: 49, followers: "980",   avatar: "KM", isUp: false },
  { rank: 20, name: "Hannah R.",    handle: "@hannahr",   pnl: "-$5,400",  pnlPercent: -33, winRate: 47, followers: "840",   avatar: "HR", isUp: false },
];

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
  const animRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return TOP_TRADERS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.handle.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || filtered !== null) return;

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
  }, [filtered]);

  const doubled = [...TOP_TRADERS, ...TOP_TRADERS];

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 13 }}>🏆</span>
            <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Top Traders</span>
          </div>
          <Link
            href={'/all-traders'}
          ><button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
            All →
          </button>
          </Link>
        </div>

        {/* Search — always visible */}
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
        </div>
      </div>

      {/* List */}
      {filtered !== null ? (
        <div className="overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="text-[11px] text-gray-600 text-center py-6">No traders found</div>
          ) : (
            filtered.map((trader) => (
              <TraderRow key={trader.rank} trader={trader} idx={trader.rank - 1} />
            ))
          )}
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