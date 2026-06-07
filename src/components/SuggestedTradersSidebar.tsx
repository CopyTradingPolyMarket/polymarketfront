"use client";

import Link from "next/link";
import type { SuggestedTrader } from "@/types/Traderprofile";

function TrendUp() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M2 9l3.5-3.5L7.5 7.5 10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  traders: SuggestedTrader[];
  currentSlug: string;
}

export default function SuggestedTradersSidebar({ traders, currentSlug }: Props) {
  const filtered = traders.filter((t) => t.slug !== currentSlug);

  return (
    <aside className="w-[260px] shrink-0 sticky top-[110px]">
      <div
        className="rounded-2xl border border-white/[0.07] px-4 py-4"
        style={{ background: "#111214", fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 13 }}>🏆</span>
            <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Top Traders</span>
          </div>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}>
            COPY
          </span>
        </div>

        {/* Trader list */}
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((trader, idx) => (
            <Link
              key={trader.slug}
              href={`/traders/${trader.slug}`}
              className="flex items-center gap-2.5 py-3 group cursor-pointer"
            >
              {/* Rank */}
              <span
                className="text-[10px] w-3 shrink-0 font-semibold tabular-nums"
                style={{ color: idx < 2 ? "#facc15" : "#4b5563" }}
              >
                {idx + 1}
              </span>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: trader.avatarGrad }}
              >
                {trader.avatar}
              </div>

              {/* Name + handle */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate leading-none">
                  {trader.name}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">{trader.handle}</div>
              </div>

              {/* PnL */}
              <div className="text-right shrink-0">
                <div
                  className="flex items-center justify-end gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ color: trader.isUp ? "#34d399" : "#f87171" }}
                >
                  <TrendUp />
                  {trader.pnl}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5 tabular-nums">{trader.winRate}% win</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Copy trading CTA */}
        <div
          className="mt-4 rounded-xl px-3 py-3 border border-white/[0.06]"
          style={{ background: "rgba(99,102,241,0.08)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CopyIcon />
            <span className="text-[11px] font-semibold" style={{ color: "#818cf8" }}>Copy Trading</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Automatically mirror top trader positions with your preferred stake size.
          </p>
          <button
            className="mt-2 w-full py-1.5 text-[11px] font-semibold rounded-lg transition-all"
            style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }}
          >
            Enable Copy Trading
          </button>
        </div>

        {/* View all link */}
        <Link
          href={'/all-traders'}
        >
        <button className="w-full mt-3 py-2 text-[11px] font-medium text-gray-600 border border-white/[0.05] rounded-xl hover:text-white hover:border-white/10 transition-all cursor-pointer">
          View all traders →
        </button>
        </Link>
      </div>
    </aside>
  );
}
