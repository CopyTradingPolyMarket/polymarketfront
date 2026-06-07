"use client";

import type {
  BreakingItem,
  HotTopic,
  LiveEvent,
  TrendingMarket,
  TopCategory,
} from "@/src/types/sidebar";

// ─── Data ───────────────────────────────────────────────────────────────────

const BREAKING: BreakingItem[] = [
  { id: 1, title: "Will Tom Steyer advance from the 2026 CA Governor primary?", percent: 11, delta: -38 },
  { id: 2, title: "Will the New York Knicks win the 2026 NBA Finals?",           percent: 79, delta:  27 },
  { id: 3, title: "Will Karl-Anthony Towns win the 2026 NBA Finals MVP?",        percent: 33, delta:  26 },
];

const HOT_TOPICS: HotTopic[] = [
  { rank: 1, label: "NBA",     volume: "$7M today",  category: "Sports"   },
  { rank: 2, label: "Knicks",  volume: "$8M today",  category: "Sports"   },
  { rank: 3, label: "Fed",     volume: "$13M today", category: "Finance"  },
  { rank: 4, label: "Spurs",   volume: "$8M today",  category: "Sports"   },
  { rank: 5, label: "Futures", volume: "$3M today",  category: "Crypto"   },
];

const LIVE_EVENTS: LiveEvent[] = [
  { id: 1, title: "NBA Finals Game 7",           endsIn: "2h 14m", participants: 3241, volume: "$1.2M", badge: "🏀 LIVE" },
  { id: 2, title: "Fed Rate Decision May 2026",  endsIn: "18h 5m", participants: 1870, volume: "$3.4M", badge: "💰 LIVE" },
  { id: 3, title: "CA Governor Primary Results", endsIn: "6h 30m", participants:  924, volume: "$680K", badge: "🗳️ LIVE" },
];

const TRENDING_MARKETS: TrendingMarket[] = [
  { id: 1, title: "Will BTC hit $120K by July?",         category: "Crypto",   change: +34, yes: 62 },
  { id: 2, title: "SpaceX Starship orbital flight 2026?", category: "Tech",     change: +18, yes: 71 },
  { id: 3, title: "Will Nvidia hit $200 by Q3?",          category: "Finance",  change: +12, yes: 48 },
  { id: 4, title: "Taylor Swift Eras Tour 2027?",         category: "Culture",  change:  +9, yes: 55 },
];

const TOP_CATEGORIES: TopCategory[] = [
  { icon: "🏀", label: "Sports",   markets: 412, volume: "$28M", color: "rgba(59,130,246,0.12)",  accent: "#60a5fa" },
  { icon: "🗳️", label: "Politics", markets: 187, volume: "$41M", color: "rgba(139,92,246,0.12)",  accent: "#a78bfa" },
  { icon: "💰", label: "Finance",  markets: 233, volume: "$63M", color: "rgba(234,179,8,0.12)",   accent: "#facc15" },
  { icon: "₿",  label: "Crypto",   markets: 156, volume: "$19M", color: "rgba(16,185,129,0.12)",  accent: "#34d399" },
  { icon: "🚀", label: "Tech",     markets:  98, volume: "$8M",  color: "rgba(251,146,60,0.12)",  accent: "#fb923c" },
  { icon: "🎭", label: "Culture",  markets:  74, volume: "$4M",  color: "rgba(236,72,153,0.12)",  accent: "#f472b6" },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Sports:  { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa"  },
  Finance: { bg: "rgba(234,179,8,0.12)",   text: "#facc15"  },
  Crypto:  { bg: "rgba(16,185,129,0.12)",  text: "#34d399"  },
  Politics:{ bg: "rgba(139,92,246,0.12)",  text: "#a78bfa"  },
  Tech:    { bg: "rgba(251,146,60,0.12)",  text: "#fb923c"  },
  Culture: { bg: "rgba(236,72,153,0.12)",  text: "#f472b6"  },
};

// ─── Tiny SVGs ───────────────────────────────────────────────────────────────

function ArrowUp() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-white/[0.07] px-4 py-4"
      style={{ background: "#111214", fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SeeAllBtn() {
  return (
    <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
      All →
    </button>
  );
}

// ─── Card 1: Breaking News ────────────────────────────────────────────────────

export function BreakingCard() {
  return (
    <Card>
      <CardHeader action={<SeeAllBtn />}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Breaking</span>
      </CardHeader>

      <div className="divide-y divide-white/[0.04]">
        {BREAKING.map((item) => {
          const isUp = item.delta >= 0;
          return (
            <div key={item.id} className="flex items-start gap-2.5 py-3 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-3 shrink-0 pt-0.5 font-medium tabular-nums">{item.id}</span>
              <p className="flex-1 text-[12px] text-gray-400 leading-snug group-hover:text-gray-200 transition-colors line-clamp-2 min-w-0">
                {item.title}
              </p>
              <div className="shrink-0 text-right ml-1">
                <div className="text-[13px] font-bold text-white tabular-nums">{item.percent}%</div>
                <div
                  className="flex items-center justify-end gap-0.5 text-[10px] font-semibold mt-0.5"
                  style={{ color: isUp ? "#34d399" : "#f87171" }}
                >
                  {isUp ? <ArrowUp /> : <ArrowDown />}
                  {Math.abs(item.delta)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 2: Hot Topics ───────────────────────────────────────────────────────

export function HotTopicsCard() {
  return (
    <Card>
      <CardHeader action={<SeeAllBtn />}>
        <span style={{ fontSize: 13 }}>🔥</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Hot Topics</span>
      </CardHeader>

      <div className="divide-y divide-white/[0.04]">
        {HOT_TOPICS.map((topic) => {
          const cat = categoryColors[topic.category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
          return (
            <div key={topic.rank} className="flex items-center gap-2.5 py-2.5 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-3 shrink-0 font-medium tabular-nums">{topic.rank}</span>
              <span className="flex-1 text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors">
                {topic.label}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ background: cat.bg, color: cat.text }}
              >
                {topic.category}
              </span>
              <span className="text-[11px] text-gray-600 shrink-0 tabular-nums">{topic.volume}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 3: Live Events ──────────────────────────────────────────────────────

export function LiveEventsCard() {
  return (
    <Card>
      <CardHeader action={<SeeAllBtn />}>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", letterSpacing: "0.05em" }}
        >
          LIVE
        </span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Live Events</span>
      </CardHeader>

      <div className="space-y-2">
        {LIVE_EVENTS.map((ev) => (
          <div
            key={ev.id}
            className="rounded-xl px-3 py-2.5 group cursor-pointer hover:bg-white/[0.03] transition-colors border border-white/[0.04]"
            style={{ background: "#0e0f11" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition-colors leading-snug flex-1 min-w-0 line-clamp-1">
                {ev.title}
              </p>
              <span className="text-[10px] font-medium shrink-0" style={{ color: "#f87171" }}>
                {ev.badge}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-gray-600">⏱ {ev.endsIn}</span>
              <span className="text-[10px] text-gray-600">👥 {ev.participants.toLocaleString()}</span>
              <span className="text-[10px] font-semibold ml-auto" style={{ color: "#34d399" }}>{ev.volume}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Card 4: Trending Markets ─────────────────────────────────────────────────

export function TrendingMarketsCard() {
  return (
    <Card>
      <CardHeader action={<SeeAllBtn />}>
        <span style={{ fontSize: 13 }}>📈</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Trending</span>
      </CardHeader>

      <div className="divide-y divide-white/[0.04]">
        {TRENDING_MARKETS.map((m) => {
          const cat = categoryColors[m.category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
          return (
            <div key={m.id} className="py-2.5 group cursor-pointer">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-[12px] text-gray-400 group-hover:text-gray-200 transition-colors leading-snug line-clamp-1 min-w-0">
                  {m.title}
                </p>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: cat.bg, color: cat.text }}
                >
                  {m.category}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {/* Yes bar */}
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.yes}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)" }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-white tabular-nums">{m.yes}%</span>
                <span
                  className="text-[10px] font-semibold flex items-center gap-0.5 tabular-nums"
                  style={{ color: "#34d399" }}
                >
                  <ArrowUp />+{m.change}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Card 5: Top Categories ───────────────────────────────────────────────────

export function TopCategoriesCard() {
  return (
    <Card>
      <CardHeader>
        <span style={{ fontSize: 13 }}>🗂️</span>
        <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Top Categories</span>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2">
        {TOP_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            className="flex flex-col items-start px-3 py-2.5 rounded-xl border border-white/[0.05] hover:border-white/10 transition-all text-left group"
            style={{ background: cat.color }}
          >
            <span className="text-lg leading-none mb-1.5">{cat.icon}</span>
            <span
              className="text-[12px] font-bold"
              style={{ color: cat.accent }}
            >
              {cat.label}
            </span>
            <span className="text-[10px] text-gray-600 mt-0.5">{cat.markets} markets</span>
            <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{cat.volume} vol</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Default export: all cards stacked ───────────────────────────────────────

export default function HomeSidebar() {
  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <BreakingCard />
      <HotTopicsCard />
      <LiveEventsCard />
      <TrendingMarketsCard />
      <TopCategoriesCard />
    </div>
  );
}
