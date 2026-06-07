"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";

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
  chartPoints: number[];   // 0-100, length ~24
  flagEmoji?: string;
  recentTrades?: { amount: string; side: "yes" | "no" }[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const FEATURED_MARKETS: FeaturedMarket[] = [
  {
    id: "peru-election",
    category: "Politics",
    subcategory: "Global Elections",
    title: "Peru Presidential Election Winner",
    flagEmoji: "🇵🇪",
    options: [
      { label: "Keiko Fujimori",      percent: 62, color: "blue"   },
      { label: "Roberto S. Palomino", percent: 38, color: "orange" },
      { label: "Rafael López Aliaga", percent:  1, color: "purple" },
      { label: "Carlos Álvarez",      percent:  1, color: "purple" },
    ],
    recentTrades: [
      { amount: "$130", side: "yes" },
      { amount: "$500", side: "yes" },
      { amount: "$5",   side: "no"  },
    ],
    volume: "$65M",
    endsAt: "Apr 12, 2026",
    chartPoints: [44,46,48,50,47,52,55,58,56,62,60,64,63,67,65,70,68,73,71,76,74,79,77,82],
  },
  {
    id: "nba-champion",
    category: "Sports",
    subcategory: "NBA Playoffs",
    title: "2026 NBA Champion",
    options: [
      { label: "New York Knicks", percent: 79, color: "blue"   },
      { label: "Indiana Pacers",  percent: 18, color: "orange" },
      { label: "OKC Thunder",     percent:  2, color: "purple" },
      { label: "Other",           percent:  1, color: "purple" },
    ],
    volume: "$42M",
    endsAt: "Jun 30, 2026",
    chartPoints: [28,32,30,36,40,38,44,48,46,52,55,58,56,60,62,65,64,68,72,70,74,76,78,79],
  },
  {
    id: "iran-peace",
    category: "Geopolitics",
    subcategory: "Iran",
    title: "US × Iran Permanent Peace Deal by End of 2026?",
    options: [
      { label: "Yes", percent: 70, color: "green" },
      { label: "No",  percent: 30, color: "red"   },
    ],
    recentTrades: [
      { amount: "$1.2K", side: "yes" },
      { amount: "$340",  side: "no"  },
    ],
    volume: "$260M",
    endsAt: "Dec 31, 2026",
    chartPoints: [18,22,20,26,30,28,34,38,36,42,45,48,46,52,55,58,56,60,63,61,64,67,69,70],
  },
  {
    id: "btc-move",
    category: "Crypto",
    subcategory: "Bitcoin",
    title: "BTC Up or Down 5% in Next 24 Hours?",
    options: [
      { label: "Up",   percent: 51, color: "green" },
      { label: "Down", percent: 49, color: "red"   },
    ],
    volume: "$18M",
    endsAt: "Live · 23h left",
    chartPoints: [50,51,49,52,50,48,51,50,52,49,51,50,53,51,49,52,50,51,50,52,51,50,52,51],
  },
  {
    id: "french-open",
    category: "Sports",
    subcategory: "Tennis",
    title: "2026 Men's French Open Winner",
    options: [
      { label: "Alexander Zverev", percent: 78, color: "blue"   },
      { label: "Carlos Alcaraz",   percent: 14, color: "orange" },
      { label: "Novak Djokovic",   percent:  5, color: "purple" },
      { label: "Other",            percent:  3, color: "purple" },
    ],
    volume: "$7M",
    endsAt: "Jun 8, 2026",
    chartPoints: [32,36,34,40,44,42,48,52,50,55,58,60,58,62,64,67,65,70,72,74,73,76,77,78],
  },
];

const AUTO_PLAY_INTERVAL = 5000; // ms

// ─── Color maps ───────────────────────────────────────────────────────────────

const LINE_COLOR: Record<string, string> = {
  blue:   "#3b82f6",
  green:  "#10b981",
  red:    "#ef4444",
  orange: "#f97316",
  purple: "#8b5cf6",
};

const BADGE_CLASS: Record<string, string> = {
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red:    "bg-red-500/10 text-red-400 border-red-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  purple: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const BAR_CLASS: Record<string, string> = {
  blue:   "bg-blue-500",
  green:  "bg-emerald-500",
  red:    "bg-red-500",
  orange: "bg-orange-400",
  purple: "bg-violet-500",
};

// ─── Interactive Sparkline ────────────────────────────────────────────────────

interface SparklineProps {
  points: number[];
  color: string;
  uid: string;
}

function Sparkline({ points, color, uid }: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; value: number; index: number } | null>(null);

  const W = 560;
  const H = 130;
  const PAD_X = 2;
  const PAD_Y = 10;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const toX = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) => H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2);

  const pts = points.map((p, i) => ({ x: toX(i), y: toY(p), v: p }));

  // Smooth cubic bezier
  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    const prev = pts[i - 1];
    const cpX = ((prev.x + pt.x) / 2).toFixed(2);
    return `${acc} C${cpX},${prev.y.toFixed(2)} ${cpX},${pt.y.toFixed(2)} ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
  }, "");

  const last = pts[pts.length - 1];
  const areaPath = `${linePath} L${last.x},${H} L${pts[0].x},${H} Z`;

  const gradId   = `sg-${uid}`;
  const clipId   = `sc-${uid}`;

  // Map mouse X → nearest data point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    // Find nearest point
    let best = 0;
    let bestDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHover({ x: pts[best].x, y: pts[best].y, value: pts[best].v, index: best });
  };

  const handleMouseLeave = () => setHover(null);

  // Timestamp labels (fake, evenly spaced)
  const timeLabels = ["1d ago", "18h", "12h", "6h", "Now"];

  return (
    <div className="relative w-full h-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line
            key={f}
            x1={0} y1={H * f} x2={W} y2={H * f}
            stroke="white" strokeOpacity="0.04"
            strokeWidth="1" strokeDasharray="3 5"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

        {/* Line */}
        <path
          d={linePath}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath={`url(#${clipId})`}
        />

        {/* Hover elements */}
        {hover && (
          <>
            {/* Vertical rule */}
            <line
              x1={hover.x} y1={0}
              x2={hover.x} y2={H}
              stroke={color}
              strokeOpacity="0.3"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {/* Dot glow */}
            <circle cx={hover.x} cy={hover.y} r="8"  fill={color} fillOpacity="0.15" />
            <circle cx={hover.x} cy={hover.y} r="4"  fill={color} />
            <circle cx={hover.x} cy={hover.y} r="2"  fill="white" />
          </>
        )}

        {/* End dot (when not hovering) */}
        {!hover && (
          <>
            <circle cx={last.x} cy={last.y} r="6" fill={color} fillOpacity="0.15" />
            <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
          </>
        )}
      </svg>

      {/* Time axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pointer-events-none">
        {timeLabels.map((t) => (
          <span key={t} className="text-[10px] text-gray-700">{t}</span>
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && (() => {
        const pct = (hover.x / W) * 100;
        const clampedPct = Math.min(Math.max(pct, 8), 92);
        return (
          <div
            className="absolute -top-1 pointer-events-none z-20"
            style={{ left: `${clampedPct}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold whitespace-nowrap"
              style={{
                background: "rgba(16,17,20,0.95)",
                borderColor: color + "55",
                color,
                boxShadow: `0 0 12px ${color}22`,
              }}
            >
              {hover.value.toFixed(1)}%
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Option row with animated bar ────────────────────────────────────────────

function OptionRow({ opt, isTop }: { opt: MarketOption; isTop?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[13px] truncate font-medium ${isTop ? "text-gray-100" : "text-gray-500"}`}>
            {opt.label}
          </span>
          <span className={`text-[13px] font-bold tabular-nums shrink-0 ml-3 ${isTop ? "text-white" : "text-gray-500"}`}>
            {opt.percent}%
          </span>
        </div>
        <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full ${BAR_CLASS[opt.color]}`}
            style={{ width: `${opt.percent}%`, opacity: isTop ? 1 : 0.35, transition: "width 600ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Market Card ──────────────────────────────────────────────────────────────

function MarketCard({ market }: { market: FeaturedMarket }) {
  const uid = useId().replace(/:/g, "");
  const primary   = market.options[0];
  const lineColor = LINE_COLOR[primary.color];
  const topTwo    = market.options.slice(0, 2);
  const rest      = market.options.slice(2);
  const isLive    = market.endsAt.toLowerCase().startsWith("live");

  return (
    <article className="flex flex-col h-full bg-[#111214] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          {market.flagEmoji && <span className="text-lg leading-none">{market.flagEmoji}</span>}
          <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-600">
            {market.category}
          </span>
          {market.subcategory && (
            <>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="text-[11px] text-gray-700">{market.subcategory}</span>
            </>
          )}
          {isLive && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <h3 className="text-[16px] font-semibold text-white leading-snug line-clamp-2 mb-4">
          {market.title}
        </h3>

        <div className="space-y-2.5">
          {topTwo.map((opt, i) => (
            <OptionRow key={opt.label} opt={opt} isTop={i === 0} />
          ))}
        </div>

        {rest.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {rest.map((opt) => (
              <span key={opt.label} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${BADGE_CLASS[opt.color]}`}>
                {opt.label} &lt;{opt.percent + 1}%
              </span>
            ))}
          </div>
        )}

        {/* Recent trades */}
        {market.recentTrades && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {market.recentTrades.map((t, i) => (
              <span
                key={i}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  t.side === "yes"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                +{t.amount}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 relative px-1 pb-5 min-h-[130px]">
        <Sparkline points={market.chartPoints} color={lineColor} uid={uid} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.05] bg-white/[0.015] shrink-0">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 12h12M4 9h8M6 6h4" stroke="#4b5563" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] text-gray-500 font-medium">{market.volume} Vol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="#4b5563" strokeWidth="1.4" />
            <path d="M5 1v3M11 1v3M2 7h12" stroke="#4b5563" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="text-[12px] text-gray-500">{market.endsAt}</span>
        </div>
      </div>
    </article>
  );
}

// ─── Icons

function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FeaturedMarketsProps {
  markets?: FeaturedMarket[];
  /** When provided, parent controls the index (controls live elsewhere) */
  externalIndex?: number;
  setExternalIndex?: (i: number) => void;
  paused?: boolean;
  setPaused?: (p: boolean) => void;
}

export default function FeaturedMarkets({
  markets = FEATURED_MARKETS,
  externalIndex,
  setExternalIndex,
  paused: externalPaused,
  setPaused: setExternalPaused,
}: FeaturedMarketsProps) {
  const controlled = externalIndex !== undefined;

  const [internalIndex, setInternalIndex] = useState(0);
  const [internalPaused, setInternalPaused] = useState(false);

  const index    = controlled ? externalIndex!  : internalIndex;
  const paused   = controlled ? externalPaused! : internalPaused;
  const setIndex = controlled ? setExternalIndex! : setInternalIndex;
  const setPaused= controlled ? setExternalPaused! : setInternalPaused;

  const dragStart = useRef<number | null>(null);
  const total     = markets.length;

  const prev = useCallback(() => setIndex(Math.max(0, index - 1)),   [index, setIndex]);
  const next = useCallback(() => setIndex((index + 1) % total),      [index, total, setIndex]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  // Swipe
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp   = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = dragStart.current - e.clientX;
    if (Math.abs(delta) > 40) { delta > 0 ? next() : prev(); setPaused(true); }
    dragStart.current = null;
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Carousel — fills parent height, no internal controls */}
      <div
        className="flex-1 overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex h-full"
          style={{ transform: `translateX(-${index * 100}%)`, transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)" }}
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
