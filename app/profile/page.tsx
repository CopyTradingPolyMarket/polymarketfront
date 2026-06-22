"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@/src/providers/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Position {
  conditionId: string;
  market: string;
  category: string;
  yesShares: number;
  noShares: number;
  costBasis: number;
  yesPrice: number;
  noPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  resolved: boolean;
}

interface Trade {
  id: string;
  market: string;
  category: string;
  type: "buy" | "sell";
  side: "YES" | "NO";
  entry: number;
  exit: number | null;
  pnl: number;
  pnlPercent: number;
  status: "open" | "closed";
  shares: number;
  date: string;
}

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  bronze:  { color: "#cd7f32", bg: "rgba(205,127,50,0.12)"  },
  silver:  { color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  gold:    { color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  diamond: { color: "#67e8f9", bg: "rgba(103,232,249,0.12)" },
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function fmt(v: number, d = 2) {
  return v.toFixed(d);
}

export default function ProfilePage() {
  const { authenticated, loading: authLoading, user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [positions, setPositions]   = useState<Position[]>([]);
  const [trades, setTrades]         = useState<Trade[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) { setDataLoading(false); return; }
    (async () => {
      try {
        const token = await getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [posRes, tradeRes] = await Promise.all([
          fetch(`${API_BASE}/api/positions`, { headers }),
          fetch(`${API_BASE}/api/trades?limit=20`, { headers }),
        ]);
        if (posRes.ok) setPositions(await posRes.json());
        if (tradeRes.ok) {
          const d = await tradeRes.json();
          setTrades(d.trades ?? []);
        }
      } catch {}
      setDataLoading(false);
    })();
  }, [authenticated, getAccessToken]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#34d399] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center gap-4 font-['DM_Sans',_sans-serif]">
        <p className="text-gray-400 text-[15px]">Connect wallet to view your profile</p>
        <Link href="/" className="text-[#34d399] text-[13px] hover:underline">← Back to markets</Link>
      </div>
    );
  }

  const tier = user?.tier ?? "bronze";
  const tierConfig = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
  const balanceUSD = user?.balance != null ? user.balance / 1_000_000 : null;

  return (
    <div className="min-h-screen bg-[#0c0c0e] font-['DM_Sans',_sans-serif]">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header card */}
        <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#34d399]/[0.06] via-transparent to-transparent pointer-events-none rounded-2xl" />
          <div className="relative flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#34d399] to-[#059669] flex items-center justify-center text-[20px] font-bold text-black shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-bold text-white">{user?.name ?? "—"}</h1>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ color: tierConfig.color, background: tierConfig.bg }}
                >
                  {tier}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 mt-0.5">@{user?.handle ?? "—"}</p>
              <div className="flex gap-4 mt-2 text-[12px] text-gray-500">
                <span><span className="text-white font-semibold">{user?.followers ?? 0}</span> followers</span>
                <span><span className="text-white font-semibold">{user?.following ?? 0}</span> following</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Balance</p>
              <p className="text-[28px] font-bold text-white tabular-nums mt-0.5">
                {balanceUSD != null
                  ? `$${balanceUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Positions */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium mb-3">Positions</h2>
          {dataLoading ? (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] p-6 text-center text-gray-600 text-sm">Loading…</div>
          ) : positions.length === 0 ? (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] p-6 text-center text-gray-600 text-sm">No open positions</div>
          ) : (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
              {positions.map((p) => {
                const side = p.yesShares > 0 ? "YES" : "NO";
                const shares = side === "YES" ? p.yesShares : p.noShares;
                const price  = side === "YES" ? p.yesPrice  : p.noPrice;
                const pnlPos = p.unrealizedPnl >= 0;
                return (
                  <Link
                    key={p.conditionId}
                    href={`/markets/${p.conditionId}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate group-hover:text-indigo-200 transition-colors">
                        {p.market}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500">{p.category}</span>
                        {p.resolved && (
                          <span className="text-[10px] text-gray-600 bg-white/[0.06] px-1.5 py-0.5 rounded-full">Resolved</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Side</p>
                        <p className={`text-[13px] font-bold ${side === "YES" ? "text-[#34d399]" : "text-red-400"}`}>{side}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Price</p>
                        <p className="text-[13px] text-white">{price}¢</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Shares</p>
                        <p className="text-[13px] text-white tabular-nums">{fmt(shares)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Cost</p>
                        <p className="text-[13px] text-white tabular-nums">${fmt(p.costBasis)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Value</p>
                        <p className="text-[13px] text-white tabular-nums">${fmt(p.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">P&L</p>
                        <p className={`text-[13px] font-bold tabular-nums ${pnlPos ? "text-[#34d399]" : "text-red-400"}`}>
                          {pnlPos ? "+" : ""}{fmt(p.unrealizedPnl)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Trade History */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium mb-3">Trade History</h2>
          {dataLoading ? (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] p-6 text-center text-gray-600 text-sm">Loading…</div>
          ) : trades.length === 0 ? (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] p-6 text-center text-gray-600 text-sm">No trades yet</div>
          ) : (
            <div className="rounded-2xl bg-[#0e0f11] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
              {trades.map((t) => {
                const pnlPos = t.pnl >= 0;
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate">{t.market}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500">{t.category}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[11px] text-gray-600">{t.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Side</p>
                        <p className={`text-[13px] font-bold ${t.side === "YES" ? "text-[#34d399]" : "text-red-400"}`}>{t.side}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Entry</p>
                        <p className="text-[13px] text-white">{t.entry}¢</p>
                      </div>
                      {t.exit != null && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">Exit</p>
                          <p className="text-[13px] text-white">{t.exit}¢</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Shares</p>
                        <p className="text-[13px] text-white tabular-nums">{fmt(t.shares)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">P&L</p>
                        <p className={`text-[13px] font-bold tabular-nums ${pnlPos ? "text-[#34d399]" : "text-red-400"}`}>
                          {pnlPos && t.pnl !== 0 ? "+" : ""}{fmt(t.pnl)}
                        </p>
                      </div>
                      <div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          t.status === "open"
                            ? "text-[#34d399] bg-[#34d399]/10"
                            : "text-gray-500 bg-white/[0.06]"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
