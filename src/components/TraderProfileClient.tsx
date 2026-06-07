"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from "recharts";
import type { TraderProfile, TraderTrade, EarningsPoint } from "@/types/Traderprofile";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  bronze:  { label: "Bronze",  color: "#cd7f32", bg: "rgba(205,127,50,0.12)"  },
  silver:  { label: "Silver",  color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  gold:    { label: "Gold",    color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  diamond: { label: "Diamond", color: "#67e8f9", bg: "rgba(103,232,249,0.12)" },
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  Sports:   { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  Finance:  { bg: "rgba(234,179,8,0.12)",   text: "#facc15" },
  Crypto:   { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
  Politics: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  Tech:     { bg: "rgba(251,146,60,0.12)",  text: "#fb923c" },
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 border border-white/[0.06] flex flex-col gap-1"
      style={{ background: "#0e0f11" }}
    >
      <span className="text-[10px] text-gray-600 font-medium tracking-wide uppercase">{label}</span>
      <span className="text-[20px] font-bold leading-none" style={{ color: accent ?? "#fff", fontFamily: "'DM Sans', sans-serif" }}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-gray-600">{sub}</span>}
    </div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isUp = payload[0].value >= 0;
  return (
    <div
      className="rounded-xl px-3 py-2 border border-white/[0.1] text-[11px]"
      style={{ background: "#1a1b1e" }}
    >
      <div className="text-gray-400 mb-1">{label}</div>
      <div className="font-bold" style={{ color: isUp ? "#34d399" : "#f87171" }}>
        ${Math.abs(payload[0].value).toLocaleString()} cumulative
      </div>
      {payload[1] && (
        <div className="text-gray-500 mt-0.5">
          Monthly: {payload[1].value >= 0 ? "+" : ""}{payload[1].value.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  profile: TraderProfile;
  trades: TraderTrade[];
  earnings: EarningsPoint[];
}

type ChartTab = "earnings" | "monthly";
type TradeTab = "all" | "open" | "won" | "lost";

export default function TraderProfileClient({ profile, trades, earnings }: Props) {
  const [following, setFollowing] = useState(false);
  const [chartTab, setChartTab] = useState<ChartTab>("earnings");
  const [tradeTab, setTradeTab] = useState<TradeTab>("all");

  const tier = TIER_CONFIG[profile.tier];
  const followerCount = following ? profile.followers + 1 : profile.followers;

  const filteredTrades = tradeTab === "all" ? trades : trades.filter((t) => t.status === tradeTab);

  return (
    <div className="min-h-screen" style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Banner ── */}
      <div
        className="w-full h-36 relative"
        style={{
          background: "linear-gradient(120deg, #0f0c29, #1a1040, #0d1b2a)",
        }}
      >
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="relative flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between"
          style={{ marginTop: -40 }}
        >

          {/* Avatar */}
          <div className="flex items-end gap-4">
            <div
              className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-2xl font-black text-white shrink-0"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                borderColor: "#0c0c0e",
              }}
            >
              {profile.avatar}
            </div>

            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-black text-white leading-none">{profile.name}</h1>
                {profile.isVerified && (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#6366f1" />
                    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: tier.bg, color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>
              <div className="text-[13px] text-gray-500 mt-0.5">{profile.handle}</div>
            </div>
          </div>

          {/* Follow button */}
          <div className="mb-2 flex gap-2">
            <button
              onClick={() => setFollowing((f) => !f)}
              className="px-5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200"
              style={
                following
                  ? { background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
                  : { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "1px solid transparent" }
              }
            >
              {following ? "Following ✓" : "+ Follow"}
            </button>
            <button
              className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              Copy Trade
            </button>
          </div>
        </div>

        {/* Bio + meta */}
        <div className="mt-4">
          <p className="text-[13px] text-gray-400 leading-relaxed max-w-xl">{profile.bio}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-[11px] text-gray-600 flex items-center gap-1">
              📍 {profile.location}
            </span>
            <span className="text-[11px] text-gray-600 flex items-center gap-1">
              📅 Joined {profile.joined}
            </span>
            <span className="text-[11px] text-gray-500 font-semibold">
              <span className="text-white">{followerCount.toLocaleString()}</span> followers
            </span>
            <span className="text-[11px] text-gray-500 font-semibold">
              <span className="text-white">{profile.following}</span> following
            </span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <StatCard label="Total PnL" value={profile.totalPnl} sub={`+${profile.totalPnlPercent}% ROI`} accent="#34d399" />
          <StatCard label="Win Rate"  value={`${profile.winRate}%`} sub={`${profile.totalTrades} trades`} accent="#60a5fa" />
          <StatCard label="Avg Return" value={`+${profile.avgReturn}%`} sub="per trade" />
          <StatCard label="Best Trade" value={`+${profile.bestTradePercent}%`} sub={profile.bestTrade} accent="#facc15" />
          <StatCard label="Hot Streak" value={`${profile.streak}W`} sub="current streak" accent="#f97316" />
          <StatCard label="Vol Traded" value={profile.volumeTraded} sub="all time" />
        </div>

        {/* ── Chart section ── */}
        <div
          className="mt-6 rounded-2xl border border-white/[0.06] px-5 py-4"
          style={{ background: "#0e0f11" }}
        >
          {/* Chart header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-white">Performance</h2>
              <p className="text-[11px] text-gray-600 mt-0.5">Cumulative earnings over time</p>
            </div>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
              {(["earnings", "monthly"] as ChartTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all capitalize"
                  style={
                    chartTab === tab
                      ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                      : { color: "#6b7280" }
                  }
                >
                  {tab === "earnings" ? "Cumulative" : "Monthly"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === "earnings" ? (
                <AreaChart data={earnings} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#pnlGrad)" dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={earnings} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}
                    fill="#6366f1"
                    label={false}
                  >
                    {earnings.map((entry, index) => (
                      <rect key={index} fill={entry.pnl >= 0 ? "#6366f1" : "#f87171"} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Past Trades ── */}
        <div className="mt-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-white">Trade History</h2>
            {/* Tab filters */}
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
              {(["all", "open", "won", "lost"] as TradeTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTradeTab(tab)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all capitalize"
                  style={
                    tradeTab === tab
                      ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                      : { color: "#6b7280" }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredTrades.map((trade) => {
              const cat = categoryColors[trade.category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
              const isUp = trade.pnlPercent >= 0;
              const statusColor = trade.status === "open" ? "#60a5fa" : trade.status === "won" ? "#34d399" : "#f87171";
              const statusBg   = trade.status === "open" ? "rgba(59,130,246,0.12)" : trade.status === "won" ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)";

              return (
               <div
  key={trade.id}
  className="
    rounded-xl
    border border-white/[0.05]
    hover:border-white/10
    transition-all
    cursor-pointer
    group
    p-3
  "
  style={{ background: "#0e0f11" }}
>
  {/* TOP ROW */}
  <div className="flex items-start gap-3">
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
      style={{
        background:
          trade.side === "YES"
            ? "rgba(16,185,129,0.15)"
            : "rgba(248,113,113,0.15)",
        color: trade.side === "YES" ? "#34d399" : "#f87171",
      }}
    >
      {trade.side}
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors line-clamp-2">
        {trade.market}
      </p>

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: cat.bg, color: cat.text }}
        >
          {trade.category}
        </span>

        <span className="text-[10px] text-gray-500">
          Entry {trade.entry}¢
          {trade.exit ? ` → ${trade.exit}¢` : ""}
        </span>
      </div>
    </div>

    <div className="text-right shrink-0">
      <div
        className="text-[14px] font-bold tabular-nums"
        style={{ color: isUp ? "#34d399" : "#f87171" }}
      >
        {trade.pnl}
      </div>

      <div
        className="text-[10px] tabular-nums"
        style={{ color: isUp ? "#34d399" : "#f87171" }}
      >
        {isUp ? "+" : ""}
        {trade.pnlPercent}%
      </div>
    </div>
  </div>

  {/* BOTTOM ROW */}
  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
    <span className="text-[10px] text-gray-500">
      {trade.date}
    </span>

    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{
        background: statusBg,
        color: statusColor,
      }}
    >
      {trade.status}
    </span>
  </div>
</div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
