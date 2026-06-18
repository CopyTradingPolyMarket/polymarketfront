"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { MOCK_MARKETS } from "@/lib/markets";
import { Market } from "@/types/market";
import { slugify } from "@/lib/slugify";

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WS_BASE  = API_BASE.replace(/^http/, 'ws');

interface ApiMarketDetail {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  tags: string[];
  slug: string;
  description: string | null;
  resolved: boolean;
  outcome: number | null;
}

interface ApiChartPoint {
  t: string;
  p: number;
}

type ApiRange = "1w" | "1m";

const RANGE_MAP: Record<Range, ApiRange> = {
  "1W":  "1w",
  "1M":  "1m",
  "3M":  "1m",
  "All": "1m",
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M vol`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K vol`;
  return `$${v.toFixed(0)} vol`;
}

function formatChartDate(iso: string, range: ApiRange): string {
  const d = new Date(iso);
  if (range === "1w") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapMarket(api: ApiMarketDetail): Market {
  return {
    id:      api.id,
    title:   api.title,
    image:   api.image ?? "",
    volume:  formatVolume(api.volume),
    options: api.options,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, trendUp }: any) {
  if (!active || !payload?.length) return null;
  const color = trendUp ? "#34d399" : "#f87171";
  return (
    <div style={{
      background: "rgba(10,10,13,0.97)",
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: "8px 14px",
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 16px ${color}18`,
    }}>
      <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: 15 }}>{payload[0].value}%</p>
    </div>
  );
}

const RANGES = ["1W", "1M", "3M", "All"] as const;
type Range = (typeof RANGES)[number];

// ─── Mobile Bottom Sheet Bet Panel ───────────────────────────────────────────

function MobileBetSheet({
  market, activeOption, setActiveOption,
  betType, setBetType, amount, setAmount,
  estimatedShares, potentialProfit, prob,
}: any) {
  const [expanded, setExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY   = useRef<number | null>(null);

  const activeOpt = market.options[activeOption];
  const isYes = betType === "yes";

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = startY.current - e.changedTouches[0].clientY;
    if (dy > 40) setExpanded(true);
    if (dy < -40) setExpanded(false);
    startY.current = null;
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          expanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        onClick={() => setExpanded(false)}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out"
        style={{
          transform: expanded ? "translateY(0)" : "translateY(calc(100% - 65px))",
          borderRadius: "20px 20px 0 0",
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <div
          className="flex items-center justify-between px-4 pb-3 cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{ background: isYes ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: isYes ? "#34d399" : "#f87171" }}
            >
              {isYes ? "Y" : "N"}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{activeOpt.label}</p>
              <p className="text-[10px]" style={{ color: isYes ? "#34d399" : "#f87171" }}>{prob}% chance</p>
            </div>
          </div>
          <button
            style={{
              padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "none",
              background: isYes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
              color: "#fff", cursor: "pointer",
              boxShadow: isYes ? "0 2px 12px rgba(16,185,129,0.3)" : "0 2px 12px rgba(239,68,68,0.3)",
            }}
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          >
            Trade
          </button>
        </div>

        {expanded && (
          <div className="px-4 pb-6 pt-1" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Outcome</p>
            <div className="flex flex-col gap-2 mb-4">
              {market.options.map((opt: any, idx: number) => {
                const active = activeOption === idx;
                return (
                  <button key={idx} onClick={() => setActiveOption(idx)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                    border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
                    background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: active ? "5px solid #fff" : "2px solid #374151", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#fff" : "#9ca3af" }}>{opt.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: opt.probability >= 50 ? "#34d399" : "#f87171" }}>{opt.probability}%</span>
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Position</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
              {(["yes", "no"] as const).map((t) => (
                <button key={t} onClick={() => setBetType(t)} style={{
                  padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "none",
                  background: betType === t ? (t === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                  color: betType === t ? (t === "yes" ? "#34d399" : "#f87171") : "#6b7280",
                }}>{t === "yes" ? "Buy Yes" : "Buy No"}</button>
              ))}
            </div>

            <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Amount</p>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 16, fontWeight: 600, pointerEvents: "none" }}>$</span>
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, paddingLeft: 30, paddingRight: 14, paddingTop: 13, paddingBottom: 13, color: "#fff", fontSize: 20, fontWeight: 700, outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
              {["10", "25", "50", "100"].map((v) => (
                <button key={v} onClick={() => setAmount(v)} style={{
                  padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: amount === v ? "rgba(255,255,255,0.08)" : "transparent",
                  color: amount === v ? "#fff" : "#6b7280",
                }}>${v}</button>
              ))}
            </div>

            {estimatedShares && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                {[{ label: "Shares", value: estimatedShares }, { label: "Avg price", value: `${(prob / 100).toFixed(2)}¢` }].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Potential profit</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>+${potentialProfit}</span>
                </div>
              </div>
            )}

            <button style={{
              width: "100%", padding: "15px 0", borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: "pointer", border: "none",
              background: isYes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
              color: "#fff",
              boxShadow: isYes ? "0 4px 24px rgba(16,185,129,0.3)" : "0 4px 24px rgba(239,68,68,0.3)",
            }}>
              {isYes ? "Buy Yes" : "Buy No"} · {activeOpt.label}
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 10 }}>Connect wallet to place a bet</p>
          </div>
        )}
      </div>

      <div style={{ height: expanded ? 0 : 76 }} />
    </>
  );
}

// ─── Desktop Bet Panel ────────────────────────────────────────────────────────

function DesktopBetPanel({ market, activeOption, setActiveOption, betType, setBetType, amount, setAmount, estimatedShares, potentialProfit, prob, router }: any) {
  const activeOpt = market.options[activeOption];
  const isYes = betType === "yes";

  return (
    <div style={{ position: "sticky", top: 72 }}>
      <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 0" }}>
          <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Outcome</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {market.options.map((opt: any, idx: number) => {
              const active = activeOption === idx;
              return (
                <button key={idx} onClick={() => setActiveOption(idx)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: active ? "5px solid #fff" : "2px solid #374151", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#fff" : "#9ca3af" }}>{opt.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: opt.probability >= 50 ? "#34d399" : "#f87171" }}>{opt.probability}%</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

        <div style={{ padding: "0 16px" }}>
          <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Position</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4 }}>
            {(["yes", "no"] as const).map((t) => (
              <button key={t} onClick={() => setBetType(t)} style={{
                padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                cursor: "pointer", border: "none",
                background: betType === t ? (t === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                color: betType === t ? (t === "yes" ? "#34d399" : "#f87171") : "#6b7280",
              }}>{t === "yes" ? "Buy Yes" : "Buy No"}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Amount</p>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 16, fontWeight: 600, pointerEvents: "none" }}>$</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, paddingLeft: 30, paddingRight: 14, paddingTop: 13, paddingBottom: 13, color: "#fff", fontSize: 20, fontWeight: 700, outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 8 }}>
            {["10", "25", "50", "100"].map((v) => (
              <button key={v} onClick={() => setAmount(v)} style={{
                padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.08)",
                background: amount === v ? "rgba(255,255,255,0.08)" : "transparent",
                color: amount === v ? "#fff" : "#6b7280",
              }}>${v}</button>
            ))}
          </div>
        </div>

        {estimatedShares && (
          <div style={{ margin: "16px 16px 0", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px" }}>
            {[{ label: "Shares", value: estimatedShares }, { label: "Avg price", value: `${(prob / 100).toFixed(2)}¢` }].map((row) => (
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

        <div style={{ padding: 16 }}>
          <button style={{
            width: "100%", padding: "14px 0", borderRadius: 14, fontSize: 14, fontWeight: 700,
            cursor: "pointer", border: "none",
            background: isYes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff",
            boxShadow: isYes ? "0 4px 24px rgba(16,185,129,0.28)" : "0 4px 24px rgba(239,68,68,0.28)",
          }}>
            {isYes ? "Buy Yes" : "Buy No"} · {activeOpt.label}
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 10 }}>Connect wallet to place a bet</p>
        </div>
      </div>

      {/* Related markets — still mock per spec */}
      <div style={{ marginTop: 16, background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
        <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 12 }}>Related markets</p>
        {MOCK_MARKETS.filter((m: Market) => m.id !== market.id).slice(0, 3).map((m: Market, i: number) => (
          <button key={m.id} onClick={() => router.push(`/markets/${slugify(m.title)}`)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 0", background: "none", border: "none", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", textAlign: "left" }}
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const params    = useParams();
  const router    = useRouter();
  const slug      = params.slug as string;
  const isMobile  = useIsMobile();

  const [market,       setMarket]       = useState<Market | null>(null);
  const [notFound,     setNotFound]     = useState(false);
  const [loadError,    setLoadError]    = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [range,        setRange]        = useState<Range>("1M");
  const [chartData,    setChartData]    = useState<{ date: string; probability: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [betType,      setBetType]      = useState<"yes" | "no">("yes");
  const [amount,       setAmount]       = useState("");
  const [livePrices,   setLivePrices]   = useState<{ yes: number; no: number } | null>(null);
  const [isLocked,     setIsLocked]     = useState(false);
  const [wsResolved,   setWsResolved]   = useState<number | null>(null);

  // Fetch market detail
  useEffect(() => {
    setMarket(null);
    setNotFound(false);
    setLoadError(false);
    fetch(`${API_BASE}/api/markets/by-slug/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiMarketDetail>;
      })
      .then((data) => { if (data) setMarket(mapMarket(data)); })
      .catch(() => setLoadError(true));
  }, [slug]);

  // Fetch chart history whenever market or range changes
  useEffect(() => {
    if (!market) return;
    const apiRange = RANGE_MAP[range];
    setChartLoading(true);
    setChartData([]);
    fetch(`${API_BASE}/api/markets/by-slug/${slug}/history?range=${apiRange}`)
      .then((r) => r.ok ? r.json() : { points: [] })
      .then((data: { points: ApiChartPoint[] }) => {
        setChartData(
          (data.points ?? []).map((pt) => ({
            date:        formatChartDate(pt.t, apiRange),
            probability: pt.p,
          }))
        );
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [market, range]);

  // Live price WebSocket — subscribes once the market loads, reconnects on drop
  useEffect(() => {
    if (!market) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1000;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(`${WS_BASE}/ws/prices`);

      ws.onopen = () => {
        backoff = 1000;
        ws!.send(JSON.stringify({ action: 'subscribe', slug }));
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === 'price_update') {
            setLivePrices({ yes: msg.yes, no: msg.no });
          } else if (msg.type === 'market_resolved') {
            setWsResolved(msg.outcome ?? null);
          } else if (msg.type === 'market_locked') {
            setIsLocked(true);
          } else if (msg.type === 'error') {
            console.error('[ws/prices]', msg.message);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (cancelled) return;
        backoff = Math.min(backoff * 2, 30_000);
        reconnectTimer = setTimeout(connect, backoff);
      };

      ws.onerror = () => { ws?.close(); };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'unsubscribe', slug }));
        }
        ws.close();
      }
    };
  }, [market, slug]);

  // Merge live WS prices into the options array (no-op when WS is quiet)
  const liveOptions = useMemo(() => {
    if (!market || !livePrices) return null;
    return market.options.map((opt) => ({
      ...opt,
      probability: opt.label.toLowerCase() === 'yes'
        ? Math.round(livePrices.yes)
        : opt.label.toLowerCase() === 'no'
        ? Math.round(livePrices.no)
        : opt.probability,
    }));
  }, [market, livePrices]);

  // ── Early returns ──

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 16 }}>
      <p style={{ fontSize: 32, fontWeight: 800 }}>404</p>
      <p style={{ color: "#6b7280" }}>Market not found</p>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Go back</button>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 16 }}>
      <p style={{ color: "#6b7280" }}>Couldn&apos;t load this market. Please try again.</p>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Go back</button>
    </div>
  );

  if (!market) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const effectiveMarket = liveOptions ? { ...market, options: liveOptions } : market;
  const activeOpt       = effectiveMarket.options[activeOption];
  const isYes           = betType === "yes";
  const prob            = activeOpt.probability;
  const estimatedShares = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? (Number(amount) / (prob / 100)).toFixed(2) : null;
  const potentialProfit = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? ((Number(amount) / (prob / 100)) - Number(amount)).toFixed(2) : null;
  const trend   = chartData.length > 1 ? chartData[chartData.length - 1].probability - chartData[0].probability : 0;
  const trendUp = trend >= 0;

  const sharedPanelProps = { market: effectiveMarket, activeOption, setActiveOption, betType, setBetType, amount, setAmount, estimatedShares, potentialProfit, prob, router };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(9,9,11,0.88)",
        backdropFilter: "blur(20px)",
        padding: isMobile ? "0 16px" : "0 24px",
        height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {!isMobile && "Back"}
        </button>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        <span style={{ color: "#9ca3af", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {market.title}
        </span>
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
            {["🔖", "🎁"].map((icon) => (
              <button key={icon} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#9ca3af", fontSize: 15, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── BODY ── */}
      <div style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "32px 24px",
        display: isMobile ? "block" : "grid",
        gridTemplateColumns: isMobile ? undefined : "1fr 352px",
        gap: 24,
        alignItems: "start",
      }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 20 }}>

          {/* Header */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <img src={market.image} alt={market.title}
              style={{ width: isMobile ? 48 : 60, height: isMobile ? 48 : 60, borderRadius: 14, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, background: "#1a1a1e" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.025em", margin: 0 }}>{market.title}</h1>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {[market.volume, "Closes Dec 31, 2026", "1,204 traders"].map((item, i) => (
                  <span key={i} style={{ fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap" }}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Resolved / locked badge — shown only when WS sends the signal */}
          {(wsResolved !== null || isLocked) && (
            <div style={{ display: "flex", gap: 8 }}>
              {wsResolved !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 100, padding: "4px 12px" }}>
                  Resolved · {wsResolved === 1 ? "YES" : "NO"}
                </span>
              )}
              {isLocked && wsResolved === null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 100, padding: "4px 12px" }}>
                  Market Locked
                </span>
              )}
            </div>
          )}

          {/* Option pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {effectiveMarket.options.map((opt: any, idx: number) => {
              const active = activeOption === idx;
              return (
                <button key={idx} onClick={() => setActiveOption(idx)} style={{
                  padding: "7px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  background: active ? "rgba(255,255,255,0.09)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                }}>
                  {opt.label}
                  <span style={{
                    marginLeft: 7, padding: "2px 7px", borderRadius: 100, fontSize: 10,
                    background: active ? (opt.probability >= 50 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.05)",
                    color: active ? (opt.probability >= 50 ? "#34d399" : "#f87171") : "#6b7280",
                  }}>{opt.probability}%</span>
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: isMobile ? "16px 14px 10px" : "20px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: isMobile ? 36 : 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{prob}%</span>
                  {chartData.length > 1 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: trendUp ? "#34d399" : "#f87171" }}>
                      {trendUp ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  chance of <strong style={{ color: "#9ca3af" }}>{activeOpt.label}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
                {RANGES.map((r) => (
                  <button key={r} onClick={() => setRange(r)} style={{
                    padding: isMobile ? "4px 8px" : "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8,
                    cursor: "pointer", border: "none",
                    background: range === r ? "rgba(255,255,255,0.1)" : "transparent",
                    color: range === r ? "#fff" : "#6b7280",
                  }}>{r}</button>
                ))}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              {chartLoading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", animation: "spin 0.8s linear infinite" }} />
                </div>
              )}
              <div style={{ opacity: chartLoading ? 0.3 : 1, transition: "opacity 0.2s" }}>
                {chartData.length === 0 && !chartLoading ? (
                  <div style={{ height: isMobile ? 160 : 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: 12, color: "#4b5563" }}>No price history available for this range.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / (isMobile ? 3 : 5)))} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={(p) => <CustomTooltip {...p} trendUp={trendUp} />} />
                      <Area type="monotone" dataKey="probability" stroke={trendUp ? "#10b981" : "#ef4444"} strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "24h Volume",    value: "$48.2K" },
              { label: "Total Volume",  value: market.volume },
              { label: "Liquidity",     value: "$312K" },
              { label: "Open Interest", value: "$198K" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px" }}>
                <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", margin: 0 }}>Recent Activity</h2>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Live</span>
            </div>
            {[
              { user: "0x3a4f...f291", action: "Yes", amount: "$250",   shares: "357",  time: "2m ago",  up: true  },
              { user: "0x9c11...b3aa", action: "No",  amount: "$80",    shares: "148",  time: "7m ago",  up: false },
              { user: "0x1b44...9de2", action: "Yes", amount: "$500",   shares: "714",  time: "15m ago", up: true  },
              { user: "0x7ec9...0fa1", action: "No",  amount: "$120",   shares: "222",  time: "32m ago", up: false },
              { user: "0x2d88...cc4b", action: "Yes", amount: "$1,000", shares: "1428", time: "1h ago",  up: true  },
            ].map((tx, idx) => (
              <div key={idx} style={{ padding: isMobile ? "10px 16px" : "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < 4 ? "1px solid rgba(255,255,255,0.04)" : "none", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: tx.up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: tx.up ? "#34d399" : "#f87171", flexShrink: 0 }}>
                    {tx.action[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {!isMobile && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6b7280" }}>{tx.user} · </span>}
                    <span style={{ fontSize: 12, color: "#4b5563" }}>bought </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tx.up ? "#34d399" : "#f87171" }}>{tx.action}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 10 : 16, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{tx.amount}</span>
                  {!isMobile && <span style={{ fontSize: 11, color: "#6b7280" }}>{tx.shares} shares</span>}
                  <span style={{ fontSize: 11, color: "#4b5563" }}>{tx.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Related markets — mobile only, still mock */}
          {isMobile && (
            <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 12 }}>Related markets</p>
              {MOCK_MARKETS.filter((m: Market) => m.id !== market.id).slice(0, 3).map((m: Market, i: number) => (
                <button key={m.id} onClick={() => router.push(`/markets/${slugify(m.title)}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 0", background: "none", border: "none", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", textAlign: "left" }}>
                  <img src={m.image} alt={m.title} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", background: "#1a1a1e", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: "#34d399", fontWeight: 600, margin: "2px 0 0" }}>{m.options[0].probability}% Yes</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — desktop only */}
        {!isMobile && <DesktopBetPanel {...sharedPanelProps} />}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileBetSheet
          {...sharedPanelProps}
          estimatedShares={estimatedShares}
          potentialProfit={potentialProfit}
        />
      )}
    </div>
  );
}
