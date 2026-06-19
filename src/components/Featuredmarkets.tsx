"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketOption {
  label: string;
  percent: number;
  color: "blue" | "orange" | "green" | "red" | "purple";
}

export interface FeaturedMarket {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  options: MarketOption[];
  volume: string;
  endsAt: string;
  chartPoints: number[];
  flagEmoji?: string;
  recentTrades?: { amount: string; side: "yes" | "no" }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const FEATURED_CATEGORIES = [
  "Sports", "Crypto", "Politics", "Elections", "Culture", "Tech", "AI",
] as const;

const AUTO_PLAY_INTERVAL = 5500;

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiMarketItem {
  slug: string;
  title: string;
  volume: number;
  options: { label: string; probability: number }[];
}

interface ApiLinePoint   { t: string; p: number }
interface ApiCandlePoint { t: string; o: number; h: number; l: number; c: number }

interface ApiHistoryResponse {
  shape: "line" | "candlestick";
  points: ApiLinePoint[] | ApiCandlePoint[];
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { stroke: string; fill: string; text: string; pill: string }> = {
  blue:   { stroke: "#38bdf8", fill: "rgba(56,189,248,0.12)",  text: "#38bdf8", pill: "rgba(56,189,248,0.1)"  },
  green:  { stroke: "#34d399", fill: "rgba(52,211,153,0.12)",  text: "#34d399", pill: "rgba(52,211,153,0.1)"  },
  red:    { stroke: "#f87171", fill: "rgba(248,113,113,0.12)", text: "#f87171", pill: "rgba(248,113,113,0.1)" },
  orange: { stroke: "#fb923c", fill: "rgba(251,146,60,0.12)",  text: "#fb923c", pill: "rgba(251,146,60,0.1)"  },
  purple: { stroke: "#a78bfa", fill: "rgba(167,139,250,0.12)", text: "#a78bfa", pill: "rgba(167,139,250,0.1)" },
};

const CATEGORY_DOT: Record<string, string> = {
  Politics:  "#a78bfa",
  Elections: "#a78bfa",
  Sports:    "#38bdf8",
  Tech:      "#38bdf8",
  Crypto:    "#34d399",
  AI:        "#34d399",
  Culture:   "#fb923c",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assignColor(label: string, index: number): MarketOption["color"] {
  const l = label.toLowerCase();
  if (l === "yes") return "green";
  if (l === "no")  return "red";
  const CYCLE = ["blue", "orange", "purple", "purple"] as const;
  return CYCLE[Math.min(index, CYCLE.length - 1)];
}

function fmtVol(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function useFeaturedMarkets(onLoad?: (count: number) => void) {
  const [markets, setMarkets] = useState<FeaturedMarket[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Step 1 — one request per category in parallel
      const catResponses = await Promise.all(
        FEATURED_CATEGORIES.map((cat) =>
          fetch(`${API_BASE}/api/markets?category=${encodeURIComponent(cat)}&sort=volume&limit=1`)
            .then((r) => (r.ok ? (r.json() as Promise<{ items: ApiMarketItem[] }>) : { items: [] }))
            .catch(() => ({ items: [] as ApiMarketItem[] }))
        )
      );

      if (cancelled) return;

      const pairs: { cat: string; item: ApiMarketItem }[] = [];
      FEATURED_CATEGORIES.forEach((cat, i) => {
        const item = catResponses[i].items[0];
        if (item) pairs.push({ cat, item });
      });

      // Step 2 — history for each market in parallel
      const histories = await Promise.all(
        pairs.map(({ item }) =>
          fetch(`${API_BASE}/api/markets/by-slug/${item.slug}/history?range=1d`)
            .then((r) => (r.ok ? (r.json() as Promise<ApiHistoryResponse>) : { shape: "line" as const, points: [] }))
            .catch(() => ({ shape: "line" as const, points: [] as ApiLinePoint[] }))
        )
      );

      if (cancelled) return;

      const result: FeaturedMarket[] = pairs.map(({ cat, item }, i) => {
        const resp = histories[i];
        const pts  = resp?.points ?? [];
        // Support both line (pt.p) and candlestick (pt.c) shapes
        const rawVals = pts.map((pt) => ("p" in pt ? pt.p : (pt as ApiCandlePoint).c));
        const chartPoints = rawVals.length >= 2 ? rawVals : [];

        return {
          id:       item.slug,
          category: cat,
          title:    item.title,
          options:  item.options.map((opt, idx) => ({
            label:   opt.label,
            percent: Math.round(opt.probability),
            color:   assignColor(opt.label, idx),
          })),
          volume:      fmtVol(item.volume),
          endsAt:      "",
          chartPoints,
        };
      });

      setMarkets(result);
      onLoad?.(result.length);
    }

    load();
    return () => { cancelled = true; };
  // onLoad is always a stable setState setter — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return markets;
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, strokeColor }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
      style={{
        background:  "rgba(10,11,14,0.97)",
        borderColor: strokeColor + "44",
        color:       strokeColor,
        boxShadow:   `0 0 16px ${strokeColor}22`,
        fontFamily:  "'DM Mono', monospace",
      }}
    >
      {payload[0].value.toFixed(1)}%
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <article
      className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/[0.06] relative"
      style={{ background: "linear-gradient(160deg, #0f1117 0%, #0c0d10 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="px-5 pt-5 pb-3 shrink-0 animate-pulse space-y-3">
        <div className="h-2.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-5 w-4/5 rounded"       style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-4 w-3/5 rounded"       style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="space-y-2 pt-1">
          <div className="h-6 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-6 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
      <div className="flex-1" style={{ minHeight: 120 }} />
      <div
        className="px-5 py-3 border-t shrink-0 animate-pulse"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="h-4 w-16 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </article>
  );
}

// ─── Market Card ──────────────────────────────────────────────────────────────

function MarketCard({ market }: { market: FeaturedMarket }) {
  const router  = useRouter();
  const gradId  = `grad-${useId().replace(/:/g, "")}`;
  const primary = market.options[0];
  const c       = COLOR_MAP[primary?.color ?? "blue"] ?? COLOR_MAP.blue;
  const isLive  = market.endsAt.toLowerCase().startsWith("live");
  const catDot  = CATEGORY_DOT[market.category] ?? "#6b7280";
  const slug    = market.id;

  const hasChart   = market.chartPoints.length >= 2;
  const chartData  = market.chartPoints.map((v, i) => ({ t: i, v }));
  const lastVal    = hasChart ? market.chartPoints[market.chartPoints.length - 1] : 0;
  const firstVal   = hasChart ? market.chartPoints[0] : 0;
  const delta      = lastVal - firstVal;
  const deltaColor = delta >= 0 ? "#34d399" : "#f87171";

  return (
    <article
      className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/[0.06] relative"
      style={{ background: "linear-gradient(160deg, #0f1117 0%, #0c0d10 100%)" }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.stroke}66, transparent)` }}
      />

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        {/* Category row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {market.flagEmoji && (
              <span className="text-base leading-none">{market.flagEmoji}</span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: catDot }} />
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: catDot }}
              >
                {market.category}
              </span>
            </span>
            {market.subcategory && (
              <span className="text-[10px] text-gray-700">/ {market.subcategory}</span>
            )}
          </div>

          {isLive ? (
            <span
              className="flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : market.endsAt ? (
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {market.endsAt}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3
          className="text-[17px] font-bold text-white leading-snug line-clamp-2 mb-4"
          style={{ letterSpacing: "-0.01em" }}
        >
          {market.title}
        </h3>

        {/* Options bars — first two */}
        <div className="space-y-2">
          {market.options.slice(0, 2).map((opt, i) => {
            const oc = COLOR_MAP[opt.color] ?? COLOR_MAP.blue;
            return (
              <div key={opt.label} className="flex items-center gap-3">
                <span
                  className="text-[11px] font-semibold shrink-0 w-7 tabular-nums text-right"
                  style={{ color: i === 0 ? oc.text : "#4b5563" }}
                >
                  {opt.percent}%
                </span>
                <div
                  className="flex-1 relative h-[3px] rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${opt.percent}%`, background: i === 0 ? oc.stroke : "#1f2937" }}
                  />
                </div>
                <span
                  className={`text-[12px] truncate flex-1 min-w-0 ${
                    i === 0 ? "text-gray-200 font-medium" : "text-gray-600"
                  }`}
                >
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Extra options as pills */}
        {market.options.length > 2 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {market.options.slice(2).map((opt) => {
              const oc = COLOR_MAP[opt.color] ?? COLOR_MAP.purple;
              return (
                <span
                  key={opt.label}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                  style={{ background: oc.pill, color: oc.text, borderColor: oc.stroke + "33" }}
                >
                  {opt.label} &lt;{opt.percent + 1}%
                </span>
              );
            })}
          </div>
        )}

        {/* Recent trades (optional — not populated from API) */}
        {market.recentTrades && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[9px] text-gray-700 font-semibold tracking-wider uppercase mr-0.5">
              Recent
            </span>
            {market.recentTrades.map((t, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: t.side === "yes" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                  color:      t.side === "yes" ? "#34d399"                : "#f87171",
                  border:     `1px solid ${t.side === "yes" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                }}
              >
                {t.side === "yes" ? "▲" : "▼"} {t.amount}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Chart (hidden when fewer than 2 points) ── */}
      {hasChart ? (
        <div className="flex-1 min-h-0 relative px-0 pb-0" style={{ minHeight: 120 }}>
          {/* Delta badge */}
          <div
            className="absolute top-2 right-4 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.5)", color: deltaColor }}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}pp
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={c.stroke} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={c.stroke} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
              <Tooltip
                content={(props) => <ChartTooltip {...props} strokeColor={c.stroke} />}
                cursor={{ stroke: c.stroke, strokeWidth: 1, strokeOpacity: 0.3, strokeDasharray: "3 3" }}
              />
              <Area
                type="monotoneX"
                dataKey="v"
                stroke={c.stroke}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: c.stroke, stroke: "#0c0d10", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Time axis labels */}
          <div className="absolute bottom-1.5 left-4 right-4 flex justify-between pointer-events-none">
            {["1d ago", "18h", "12h", "6h", "Now"].map((t) => (
              <span key={t} className="text-[9px] text-gray-700">{t}</span>
            ))}
          </div>
        </div>
      ) : (
        // Spacer keeps footer pinned to bottom when there's no chart
        <div className="flex-1" style={{ minHeight: 120 }} />
      )}

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M2 12h12M4 9h8M6 6h4" stroke="#4b5563" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-semibold text-gray-500">{market.volume}</span>
          <span className="text-[9px] text-gray-700 font-medium tracking-wider uppercase">Vol</span>
        </div>

        <button
          onClick={() => router.push(`/markets/${slug}`)}
          className="text-[11px] font-bold px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
          style={{ background: c.fill, color: c.text, border: `1px solid ${c.stroke}33` }}
        >
          Trade →
        </button>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FeaturedMarketsProps {
  markets?: FeaturedMarket[];        // optional override; if omitted, fetched from API
  externalIndex?: number;
  setExternalIndex?: (i: number) => void;
  paused?: boolean;
  setPaused?: (p: boolean) => void;
  onLoad?: (count: number) => void;
}

export default function FeaturedMarkets({
  markets: marketsProp,
  externalIndex,
  setExternalIndex,
  paused: externalPaused,
  setPaused: setExternalPaused,
  onLoad,
}: FeaturedMarketsProps) {
  const controlled = externalIndex !== undefined;

  const [internalIndex,  setInternalIndex]  = useState(0);
  const [internalPaused, setInternalPaused] = useState(false);

  const index     = controlled ? externalIndex!     : internalIndex;
  const paused    = controlled ? externalPaused!    : internalPaused;
  const setIndex  = controlled ? setExternalIndex!  : setInternalIndex;
  const setPaused = controlled ? setExternalPaused! : setInternalPaused;

  // If a markets prop is passed, skip fetching; otherwise fetch from API.
  const fetchedMarkets = useFeaturedMarkets(marketsProp ? undefined : onLoad);
  const markets    = marketsProp ?? fetchedMarkets ?? [];
  const isLoading  = !marketsProp && fetchedMarkets === null;

  const dragStart = useRef<number | null>(null);
  const total     = markets.length;

  const prev = useCallback(() => setIndex(Math.max(0, index - 1)), [index, setIndex]);
  const next = useCallback(
    () => setIndex((index + 1) % Math.max(1, total)),
    [index, total, setIndex]
  );

  useEffect(() => {
    if (paused || isLoading || total === 0) return;
    const id = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, next, isLoading, total]);

  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp   = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = dragStart.current - e.clientX;
    if (Math.abs(delta) > 40) { delta > 0 ? next() : prev(); setPaused(true); }
    dragStart.current = null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex-1 overflow-hidden rounded-2xl">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center rounded-2xl border border-white/[0.06]"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(160deg, #0f1117 0%, #0c0d10 100%)" }}
      >
        <p className="text-gray-600 text-sm">No featured markets available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div
        className="flex-1 overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex h-full"
          style={{
            transform:  `translateX(-${index * 100}%)`,
            transition: "transform 450ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {markets.map((m) => (
            <div key={m.id} className="min-w-full h-full">
              <MarketCard market={m} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
