"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MOCK_MARKETS } from "@/lib/markets";
import { Market } from "@/types/market";
import { slugify } from "@/lib/slugify";

function generateChartData(finalProb: number, days = 30) {
  const data = [];
  let prob = Math.max(10, Math.min(90, finalProb + (Math.random() * 20 - 10)));
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    prob += Math.random() * 6 - 3;
    prob = Math.max(5, Math.min(95, prob));
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      probability: Math.round(prob),
    });
  }
  data[data.length - 1].probability = finalProb;
  return data;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "rgba(15,15,18,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "8px 14px",
        backdropFilter: "blur(12px)",
      }}>
        <p style={{ color: "#6b7280", fontSize: 11, marginBottom: 2 }}>{label}</p>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

const RANGES = ["1W", "1M", "3M", "All"] as const;
type Range = (typeof RANGES)[number];

export default function MarketPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [range, setRange] = useState<Range>("1M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [betType, setBetType] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const found = MOCK_MARKETS.find((m) => slugify(m.title) === slug);
    if (found) setMarket(found);
    else setNotFound(true);
  }, [slug]);

  useEffect(() => {
    if (!market) return;
    const days = range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : 180;
    setChartData(generateChartData(market.options[activeOption].probability, days));
  }, [market, activeOption, range]);

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 16 }}>
        <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>404</p>
        <p style={{ color: "#6b7280" }}>Market not found</p>
        <button onClick={() => router.back()} style={{ marginTop: 8, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          ← Go back
        </button>
      </div>
    );
  }

  if (!market) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeOpt = market.options[activeOption];
  const isYes = betType === "yes";
  const prob = activeOpt.probability;
  const estimatedShares = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? (Number(amount) / (prob / 100)).toFixed(2) : null;
  const potentialProfit = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? ((Number(amount) / (prob / 100)) - Number(amount)).toFixed(2) : null;
  const trend = chartData.length > 1
    ? chartData[chartData.length - 1].probability - chartData[0].probability : 0;
  const trendUp = trend >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(20px)",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Markets
        </button>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ color: "#9ca3af", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
          {market.title}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["🔖", "🎁"].map(icon => (
            <button key={icon} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#9ca3af", fontSize: 16, cursor: "pointer", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {icon}
            </button>
          ))}
        </div>
      </nav>

      {/* BODY */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 352px", gap: 24, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <img src={market.image} alt={market.title}
              style={{ width: 60, height: 60, borderRadius: 16, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, background: "#1a1a1e" }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.025em", margin: 0 }}>{market.title}</h1>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {[market.volume, "Closes Dec 31, 2026", "1,204 traders"].map((item, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#6b7280", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 100, padding: "3px 10px" }}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Option pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {market.options.map((opt, idx) => {
              const active = activeOption === idx;
              return (
                <button key={idx} onClick={() => setActiveOption(idx)} style={{
                  padding: "7px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  background: active ? "rgba(255,255,255,0.09)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                }}>
                  {opt.label}
                  <span style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 100, fontSize: 11,
                    background: active ? (opt.probability >= 50 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.05)",
                    color: active ? (opt.probability >= 50 ? "#34d399" : "#f87171") : "#6b7280",
                  }}>{opt.probability}%</span>
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{prob}%</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: trendUp ? "#34d399" : "#f87171" }}>
                    {trendUp ? "▲" : "▼"} {Math.abs(trend)}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>
                  chance of <strong style={{ color: "#9ca3af" }}>{activeOpt.label}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
                {RANGES.map((r) => (
                  <button key={r} onClick={() => setRange(r)} style={{
                    padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8,
                    cursor: "pointer", border: "none", transition: "all 0.15s",
                    background: range === r ? "rgba(255,255,255,0.1)" : "transparent",
                    color: range === r ? "#fff" : "#6b7280",
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
                <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="probability" stroke={trendUp ? "#10b981" : "#ef4444"} strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: trendUp ? "#10b981" : "#ef4444", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "24h Volume", value: "$48.2K" },
              { label: "Total Volume", value: market.volume },
              { label: "Liquidity", value: "$312K" },
              { label: "Open Interest", value: "$198K" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", margin: 0 }}>Recent Activity</h2>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Live</span>
            </div>
            {[
              { user: "0x3a4f...f291", action: "Yes", amount: "$250", shares: "357", time: "2m ago", up: true },
              { user: "0x9c11...b3aa", action: "No", amount: "$80", shares: "148", time: "7m ago", up: false },
              { user: "0x1b44...9de2", action: "Yes", amount: "$500", shares: "714", time: "15m ago", up: true },
              { user: "0x7ec9...0fa1", action: "No", amount: "$120", shares: "222", time: "32m ago", up: false },
              { user: "0x2d88...cc4b", action: "Yes", amount: "$1,000", shares: "1428", time: "1h ago", up: true },
            ].map((tx, idx) => (
              <div key={idx}
                style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: tx.up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: tx.up ? "#34d399" : "#f87171" }}>
                    {tx.action[0]}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#9ca3af" }}>{tx.user}</span>
                    <span style={{ fontSize: 12, color: "#4b5563" }}>bought</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tx.up ? "#34d399" : "#f87171" }}>{tx.action}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{tx.amount}</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{tx.shares} shares</span>
                  <span style={{ fontSize: 11, color: "#4b5563" }}>{tx.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — sticky bet panel */}
        <div style={{ position: "sticky", top: 72 }}>
          <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>

            {/* Outcome */}
            <div style={{ padding: "18px 16px 0" }}>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Outcome</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {market.options.map((opt, idx) => {
                  const active = activeOption === idx;
                  return (
                    <button key={idx} onClick={() => setActiveOption(idx)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
                      border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: active ? "5px solid #fff" : "2px solid #374151", transition: "all 0.15s", flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#fff" : "#9ca3af" }}>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: opt.probability >= 50 ? "#34d399" : "#f87171" }}>{opt.probability}%</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

            {/* Buy Yes/No */}
            <div style={{ padding: "0 16px" }}>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Position</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4 }}>
                {(["yes", "no"] as const).map(t => (
                  <button key={t} onClick={() => setBetType(t)} style={{
                    padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", border: "none", transition: "all 0.15s",
                    background: betType === t ? (t === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                    color: betType === t ? (t === "yes" ? "#34d399" : "#f87171") : "#6b7280",
                  }}>
                    {t === "yes" ? "Buy Yes" : "Buy No"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div style={{ padding: "16px 16px 0" }}>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Amount</p>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 16, fontWeight: 600, pointerEvents: "none" }}>$</span>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, paddingLeft: 30, paddingRight: 14, paddingTop: 13, paddingBottom: 13, color: "#fff", fontSize: 20, fontWeight: 700, outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 8 }}>
                {["10", "25", "50", "100"].map(v => (
                  <button key={v} onClick={() => setAmount(v)} style={{
                    padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: amount === v ? "rgba(255,255,255,0.08)" : "transparent",
                    color: amount === v ? "#fff" : "#6b7280",
                  }}>${v}</button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {estimatedShares && (
              <div style={{ margin: "16px 16px 0", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px" }}>
                {[
                  { label: "Shares", value: estimatedShares },
                  { label: "Avg price", value: `${(prob / 100).toFixed(2)}¢` },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Potential profit</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>+${potentialProfit}</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: 16 }}>
              <button style={{
                width: "100%", padding: "14px 0", borderRadius: 14, fontSize: 14, fontWeight: 700,
                cursor: "pointer", border: "none", transition: "opacity 0.15s",
                background: isYes ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                boxShadow: isYes ? "0 4px 24px rgba(16,185,129,0.28)" : "0 4px 24px rgba(239,68,68,0.28)",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {isYes ? "Buy Yes" : "Buy No"} · {activeOpt.label}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 10 }}>Connect wallet to place a bet</p>
            </div>
          </div>

          {/* Related markets */}
          <div style={{ marginTop: 16, background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 12 }}>Related markets</p>
            {MOCK_MARKETS.filter(m => m.id !== market.id).slice(0, 3).map((m, i) => (
              <button key={m.id} onClick={() => router.push(`/markets/${slugify(m.title)}`)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none", background: "none", border: "none", borderBottomColor: i < 2 ? "rgba(255,255,255,0.04)" : "transparent", borderBottomStyle: "solid", borderBottomWidth: i < 2 ? 1 : 0, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <img src={m.image} alt={m.title} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", background: "#1a1a1e", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.title}</p>
                  <p style={{ fontSize: 11, color: "#34d399", fontWeight: 600, margin: "2px 0 0" }}>{m.options[0].probability}% Yes</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
