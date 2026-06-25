"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorKey = "blue" | "orange" | "green" | "red" | "purple";

export interface MarketOption {
  label: string;
  percent: number;
  color: ColorKey;
  multiplier: number;   // payout shown as "x"
  image?: string;
  slug?: string;        // used to fetch this option's history line
}

export interface ChartSeries {
  label: string;
  stroke: string;                     // hex line color
  percent: number;
  points: { t: number; v: number }[]; // t = epoch ms
}

export interface FeaturedMarket {
  id: string;
  slug: string;               // routing target → /markets/{slug}
  category: string;
  title: string;
  options: MarketOption[];
  optionsCount: number;       // total number of outcomes ("N more" = optionsCount - 2)
  volume: string;
  chartSeries?: ChartSeries[]; // optional: if provided, used as-is; otherwise fetched lazily per active card
  eventId?: string;           // set for grouped events → used for comments
  conditionId?: string;       // set for single binary markets → used for comments
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const FEATURED_CATEGORIES = [
  "Sports", "Crypto", "Politics", "Elections", "Culture", "Tech", "AI",
] as const;

const AUTO_PLAY_INTERVAL = 5500;

// How many markets to pull per category so we have enough siblings to form an
// event group. Whichever eventId group has the highest total volume becomes
// that category's featured card.
const PER_CATEGORY_FETCH = 5;

// Range passed to the history endpoint. Valid values depend on your backend —
// adjust if "1m" isn't supported. Empty/failed history just hides the chart.
const HISTORY_RANGE = "1m";

// Max number of option lines to draw. Set high so multi-option events (e.g.
// a World Cup with many teams) render every option as its own line. Lower it
// if you want to cap noisy events; raise toward Infinity for truly all.
const MAX_CHART_LINES = 4;

// Distinct line colors. Beyond the fixed list we fall back to evenly spaced
// hues (golden-angle) so any number of options still gets a unique color.
const LINE_PALETTE = [
  "#34d399", "#38bdf8", "#fb923c", "#a78bfa", "#f87171", "#fbbf24",
  "#22d3ee", "#f472b6", "#a3e635", "#818cf8", "#fb7185", "#2dd4bf",
];

function lineColor(i: number): string {
  if (i < LINE_PALETTE.length) return LINE_PALETTE[i];
  const hue = (i * 137.508) % 360;
  return `hsl(${hue.toFixed(0)}, 70%, 62%)`;
}

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiMarketItem {
  id: string;
  slug: string;
  title: string;
  volume: number;
  image: string | null;
  eventId: string | null;
  tags?: string[];
  options: { label: string; probability: number }[];
}

interface ApiLinePoint   { t: string; p: number }
interface ApiCandlePoint { t: string; o: number; h: number; l: number; c: number }

interface ApiHistoryResponse {
  shape: "line" | "candlestick";
  points: ApiLinePoint[] | ApiCandlePoint[];
}

interface ApiComment {
  id: string;
  body: string;
  createdAt: string;
  user: { username: string; avatarUrl: string | null };
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<ColorKey, { stroke: string; fill: string; text: string; pill: string }> = {
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

function fmtVol(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtVolExact(v: number): string {
  return `$${Math.round(v).toLocaleString("en-US")} vol`;
}

function impliedMultiplier(percent: number): number {
  if (percent <= 0) return 0;
  return Math.round((100 / percent) * 100) / 100;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// Parse a market title into an option label + the parent event title.
// Extend with more shapes as you encounter them; falls back to null (caller
// then uses the raw market title as the option label).
const TITLE_TEMPLATES: {
  re: RegExp;
  option: (m: RegExpMatchArray) => string;
  event: (m: RegExpMatchArray) => string;
}[] = [
  {
    re: /^Will (.+?)'s next team be (?:the )?(.+?)\??$/i,
    option: (m) => m[2],
    event:  (m) => `${m[1]}'s Next Team`,
  },
  {
    re: /^Will (.+?) win (.+?)\??$/i,
    option: (m) => m[1],
    event:  (m) => `${m[2].replace(/^the\s+/i, "")} — Winner`,
  },
];

function parseTitle(title: string): { option: string; event: string } | null {
  for (const tpl of TITLE_TEMPLATES) {
    const m = title.match(tpl.re);
    if (m) return { option: tpl.option(m), event: tpl.event(m) };
  }
  return null;
}

function yesProbability(opts: { label: string; probability: number }[]): number {
  const yes = opts.find((o) => o.label.toLowerCase() === "yes") ?? opts[0];
  return yes?.probability ?? 0;
}

// Convert a raw history response into epoch-ms points, supporting both the
// line (pt.p) and candlestick (pt.c) shapes.
function historyToPoints(resp: ApiHistoryResponse | null): { t: number; v: number }[] {
  if (!resp?.points?.length) return [];
  return resp.points
    .map((pt) => ({
      t: Date.parse(pt.t),
      v: "p" in pt ? pt.p : (pt as ApiCandlePoint).c,
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v));
}

// ─── Build the merged chart dataset ─────────────────────────────────────────────
//
// Each series can have its own timestamps, so we union all timestamps, sort
// them, and fill each series by lookup. Missing values are left null and
// bridged with connectNulls on the line.

function buildChartData(series: ChartSeries[]): {
  data: Record<string, number | null>[];
  ticks: number[];
} {
  const valid = series.filter((s) => s.points.length >= 2);
  if (valid.length === 0) return { data: [], ticks: [] };

  const allT = new Set<number>();
  valid.forEach((s) => s.points.forEach((p) => allT.add(p.t)));
  const sortedT = Array.from(allT).sort((a, b) => a - b);

  const maps = valid.map((s) => new Map(s.points.map((p) => [p.t, p.v])));
  const data = sortedT.map((t) => {
    const row: Record<string, number | null> = { t };
    maps.forEach((m, i) => {
      row[`s${i}`] = m.has(t) ? (m.get(t) as number) : null;
    });
    return row;
  });

  // ~5 evenly spaced ticks
  const ticks: number[] = [];
  const n = Math.min(5, sortedT.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (sortedT.length - 1)) / Math.max(1, n - 1));
    ticks.push(sortedT[idx]);
  }

  return { data, ticks: Array.from(new Set(ticks)) };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function useFeaturedMarkets(onLoad?: (count: number) => void) {
  const [markets, setMarkets] = useState<FeaturedMarket[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Step 1 — pull a batch per category in parallel.
      const catResponses = await Promise.all(
        FEATURED_CATEGORIES.map((cat) =>
          fetch(`${API_BASE}/api/markets?category=${encodeURIComponent(cat)}&sort=volume&limit=${PER_CATEGORY_FETCH}`)
            .then((r) => (r.ok ? (r.json() as Promise<{ items: ApiMarketItem[] }>) : { items: [] }))
            .catch(() => ({ items: [] as ApiMarketItem[] }))
        )
      );
      if (cancelled) return;

      // Step 2 — for each category, pick the highest-volume eventId group.
      type Pick = { cat: string; group: ApiMarketItem[] };
      const picks: Pick[] = [];

      FEATURED_CATEGORIES.forEach((cat, i) => {
        const items = catResponses[i].items ?? [];
        if (items.length === 0) return;

        const groups = new Map<string, ApiMarketItem[]>();
        items.forEach((it) => {
          const key = it.eventId ?? `solo:${it.id}`;
          const arr = groups.get(key) ?? [];
          arr.push(it);
          groups.set(key, arr);
        });

        let best: ApiMarketItem[] | null = null;
        let bestVol = -1;
        groups.forEach((g) => {
          const vol = g.reduce((s, m) => s + m.volume, 0);
          if (vol > bestVol) { bestVol = vol; best = g; }
        });
        if (best) picks.push({ cat, group: best });
      });

      // Step 3 — build option lists + figure out which slugs need history.
      const built = picks.map(({ cat, group }) => {
        const isEvent = group.length > 1;

        let title: string;
        let options: MarketOption[];
        let eventId: string | undefined;
        let conditionId: string | undefined;

        if (isEvent) {
          eventId = group[0].eventId ?? undefined;
          // option per sibling market, ordered by probability desc
          const parsed = group.map((m) => {
            const info = parseTitle(m.title);
            return {
              market: m,
              label: info?.option ?? m.title,
              event: info?.event,
              percent: Math.round(yesProbability(m.options)),
            };
          });
          parsed.sort((a, b) => b.percent - a.percent);

          title = parsed.find((p) => p.event)?.event
            ?? group.reduce((a, b) => (a.volume > b.volume ? a : b)).title;

          options = parsed.map((p) => ({
            label: p.label,
            percent: p.percent,
            color: "blue", // table pills are neutral; chart colors assigned later
            multiplier: impliedMultiplier(p.percent),
            image: p.market.image ?? undefined,
            slug: p.market.slug,
          }));
        } else {
          const m = group[0];
          conditionId = m.id;
          title = m.title;
          options = m.options.map((o) => ({
            label: o.label,
            percent: Math.round(o.probability),
            color: o.label.toLowerCase() === "no" ? "red" : "green",
            multiplier: impliedMultiplier(o.probability),
            image: m.image ?? undefined,
            slug: m.slug, // history is per-market; only the top line is drawable
          }));
        }

        return { cat, group, isEvent, title, options, eventId, conditionId };
      });

      // Build FeaturedMarket objects WITHOUT chart history — each card fetches
      // histories for all its options lazily when it becomes the active slide.
      const result: FeaturedMarket[] = built.map((b) => {
        const totalVol = b.group.reduce((s, m) => s + m.volume, 0);

        // route to the real market slug — for an event group use the
        // highest-volume sibling's slug (placeholder until there's a dedicated
        // event-level slug/page).
        const routeSlug = b.group.reduce((a, c) => (c.volume > a.volume ? c : a), b.group[0]).slug;

        return {
          id: b.eventId ?? b.conditionId ?? b.group[0].id,
          slug: routeSlug,
          category: b.cat,
          title: b.title,
          options: b.options,
          optionsCount: b.isEvent ? b.group.length : b.options.length,
          volume: fmtVolExact(totalVol),
          eventId: b.eventId,
          conditionId: b.conditionId,
        };
      });

      setMarkets(result);
      onLoad?.(result.length);
    }

    load();
    return () => { cancelled = true; };
  // onLoad is a stable setter — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return markets;
}

// Latest comments for the active card. Only fires when `enabled` is true so we
// don't request comments for off-screen cards.
//
// ASSUMED endpoint: GET /api/comments?eventId=... | ?conditionId=...
// Returns either an array or { items: [...] } of the POST response shape.
// Rename/reshape here if your read endpoint differs.
function useLatestComments(args: { eventId?: string; conditionId?: string; enabled: boolean }) {
  const [state, setState] = useState<{ items: ApiComment[]; loaded: boolean }>({ items: [], loaded: false });

  useEffect(() => {
    if (!args.enabled || state.loaded) return;
    const q = args.eventId
      ? `eventId=${encodeURIComponent(args.eventId)}`
      : args.conditionId
      ? `conditionId=${encodeURIComponent(args.conditionId)}`
      : "";
    if (!q) { setState({ items: [], loaded: true }); return; }

    let cancelled = false;
    fetch(`${API_BASE}/api/comments?${q}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        if (cancelled) return;
        const raw: ApiComment[] = Array.isArray(j) ? j : (j.items ?? []);
        const sorted = [...raw].sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
        setState({ items: sorted, loaded: true });
      })
      .catch(() => { if (!cancelled) setState({ items: [], loaded: true }); });

    return () => { cancelled = true; };
  }, [args.enabled, args.eventId, args.conditionId, state.loaded]);

  return state;
}

// Lazily fetch a price-history line for every option of a card, but only once
// it becomes the active slide (avoids firing dozens of history requests for
// off-screen cards). If the market already carries chartSeries (passed via
// prop), that's used directly.
//
// Returns null while still loading, or a ChartSeries[] once resolved.
function useChartSeries(market: FeaturedMarket, active: boolean): ChartSeries[] | null {
  const [series, setSeries] = useState<ChartSeries[] | null>(market.chartSeries ?? null);

  useEffect(() => {
    if (market.chartSeries) return;          // provided externally — nothing to fetch
    if (!active || series !== null) return;  // only fetch once, lazily, when active

    const toDraw = market.options.filter((o) => o.slug).slice(0, MAX_CHART_LINES);
    if (toDraw.length === 0) { setSeries([]); return; }

    let cancelled = false;
    Promise.all(
      toDraw.map((o, i) =>
        fetch(`${API_BASE}/api/markets/by-slug/${o.slug}/history?range=${HISTORY_RANGE}`)
          .then((r) => (r.ok ? (r.json() as Promise<ApiHistoryResponse>) : null))
          .catch(() => null)
          .then((resp) => ({
            label: o.label,
            stroke: lineColor(i),
            percent: o.percent,
            points: historyToPoints(resp),
          } as ChartSeries))
      )
    ).then((res) => { if (!cancelled) setSeries(res); });

    return () => { cancelled = true; };
  }, [market, active, series]);

  return series;
}

// ─── Recharts tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-2.5 py-2 rounded-lg text-[11px] border space-y-1"
      style={{
        background:  "rgba(10,11,14,0.97)",
        borderColor: "rgba(255,255,255,0.1)",
        fontFamily:  "'DM Mono', monospace",
      }}
    >
      <div className="text-gray-500 text-[10px]">{fmtDate(label)}</div>
      {payload
        .filter((p: any) => p.value != null)
        .map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 font-bold" style={{ color: p.stroke }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.stroke }} />
            {Number(p.value).toFixed(1)}%
          </div>
        ))}
    </div>
  );
}

// End-of-line dot factory — renders a pulsing dot at the last non-null point
// of a series (the "current value" marker), to suggest the line is live.
function makeEndDot(lastIdx: number, color: string) {
  return function EndDot(props: any) {
    if (props.index !== lastIdx || props.value == null) return null;
    return (
      <g>
        {/* pulsing ring */}
        <circle cx={props.cx} cy={props.cy} r={4} fill={color} opacity={0.4}>
          <animate attributeName="r" values="4;12;4" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {/* solid core */}
        <circle cx={props.cx} cy={props.cy} r={3.5} fill={color} stroke="#0c0d10" strokeWidth={1.5} />
      </g>
    );
  };
}

// ─── Multi-line chart ──────────────────────────────────────────────────────────

function MultiLineChart({ series }: { series: ChartSeries[] }) {
  const { data, ticks } = buildChartData(series);
  const valid = series.filter((s) => s.points.length >= 2);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-gray-700">
        No price history yet.
      </div>
    );
  }

  // last non-null index per series, for the end dot
  const lastIdxByKey = valid.map((_, i) => {
    let last = -1;
    data.forEach((row, idx) => { if (row[`s${i}`] != null) last = idx; });
    return last;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid
          horizontal
          vertical={false}
          strokeDasharray="2 5"
          stroke="rgba(255,255,255,0.07)"
        />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={ticks}
          tickFormatter={fmtDate}
          tick={{ fontSize: 9, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis
          orientation="right"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 9, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        {valid.map((s, i) => (
          <Line
            key={i}
            type="monotone"
            dataKey={`s${i}`}
            stroke={s.stroke}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
            dot={makeEndDot(lastIdxByKey[i], s.stroke)}
            activeDot={{ r: 4, fill: s.stroke, stroke: "#0c0d10", strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Comments preview ──────────────────────────────────────────────────────────

function CommentsPreview({
  market,
  active,
  onOpen,
}: {
  market: FeaturedMarket;
  active: boolean;
  onOpen: () => void;
}) {
  const { items, loaded } = useLatestComments({
    eventId: market.eventId,
    conditionId: market.conditionId,
    enabled: active,
  });

  const latest = items[0];

  return (
    <button onClick={onOpen} className="text-left w-full group">
      {!loaded ? (
        <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
      ) : latest ? (
        <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-3">
          <span className="font-bold text-gray-300">Comments</span>
          <span className="text-gray-700"> · </span>
          <span className="text-gray-500">@{latest.user.username}</span>
          <span className="text-gray-700"> · </span>
          {latest.body}
        </p>
      ) : (
        <p className="text-[13px] text-gray-600 leading-relaxed">
          <span className="font-bold text-gray-500">Comments</span> · No comments yet.{" "}
          <span className="text-emerald-400 group-hover:underline">Be the first →</span>
        </p>
      )}
    </button>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <article
      className="rounded-2xl border border-white/[0.06] relative overflow-hidden p-6 animate-pulse"
      style={{ background: "#131316", minHeight: 360 }}
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-7 w-3/4 rounded"      style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="space-y-2 pt-3">
            <div className="h-8 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-8 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
        <div className="flex-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", minHeight: 200 }} />
      </div>
    </article>
  );
}

// ─── Market Card ──────────────────────────────────────────────────────────────

function MarketCard({ market, active }: { market: FeaturedMarket; active: boolean }) {
  const router = useRouter();
  const catDot = CATEGORY_DOT[market.category] ?? "#6b7280";
  const slug   = market.slug;
  const tableOptions = market.options.slice(0, 2);
  const moreCount = Math.max(0, market.optionsCount - tableOptions.length);

  const series = useChartSeries(market, active);
  const legend = (series ?? []).filter((s) => s.points.length >= 2);

  const open = () => router.push(`/markets/${slug}`);
  const openOption = (opt: MarketOption) =>
    router.push(`/markets/${opt.slug ?? slug}`);

  return (
    <article
      className="rounded-2xl border border-white/[0.06] relative overflow-hidden"
      style={{ background: "#131316", minHeight: 360 }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
      />

      <div className="flex flex-col md:flex-row">
        {/* ─── LEFT: info ─── */}
        <div className="flex-1 min-w-0 p-6 flex flex-col">
          {/* Category */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: catDot + "22" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: catDot }} />
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: catDot }}>
              {market.category}
            </span>
          </div>

          {/* Title */}
          <button onClick={open} className="text-left">
            <h2
              className="text-[26px] font-bold text-white leading-tight line-clamp-2 mb-5 hover:opacity-90 transition"
              style={{ letterSpacing: "-0.02em" }}
            >
              {market.title}
            </h2>
          </button>

          {/* Options table */}
          <div className="mb-1">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center mb-2 px-1">
              <span className="text-[11px] text-gray-600 font-medium">Market</span>
              <span className="text-[11px] text-gray-600 font-medium text-right">Pays out</span>
              <span className="text-[11px] text-gray-600 font-medium text-center w-[72px]">Odds</span>
            </div>

            <div className="space-y-1">
              {tableOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => openOption(opt)}
                  className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center w-full px-1 py-1.5 rounded-lg hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {opt.image ? (
                      <img src={opt.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-white/10 shrink-0" />
                    )}
                    <span className="text-[14px] text-white font-medium truncate text-left">{opt.label}</span>
                  </div>

                  <span className="text-[13px] text-gray-400 tabular-nums text-right">
                    {opt.multiplier.toFixed(2)}x
                  </span>

                  <span className="text-[14px] font-bold text-white border border-emerald-500/40 rounded-full px-3 py-1.5 tabular-nums text-center w-[72px]">
                    {opt.percent}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume + more */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[13px] text-gray-500">{market.volume}</span>
            {moreCount > 0 && (
              <button onClick={open} className="text-[13px] text-gray-500 hover:text-gray-300 transition">
                {moreCount} more
              </button>
            )}
          </div>

          {/* Divider + comments */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <CommentsPreview market={market} active={active} onOpen={open} />
          </div>
        </div>

        {/* ─── RIGHT: chart ─── */}
        <div className="flex-1 min-w-0 p-6 md:pl-2 flex flex-col">
          {/* Legend */}
          {legend.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 max-h-[64px] overflow-none w-[80%]">
              {legend.map((s) => (
                <span key={s.label} className="flex items-center gap-2 text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 text-[9px]" style={{ background: s.stroke }} />
                  <span className="text-gray-300 text-[9px]">{s.label}</span>
                  <span className="font-bold text-white tabular-nums text-[9px]">{s.percent}%</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex-1" style={{ minHeight: 240 }}>
            {series === null ? (
              <div className="flex items-center justify-center h-full text-[11px] text-gray-700 animate-pulse">
                Loading chart…
              </div>
            ) : (
              <MultiLineChart series={series} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FeaturedMarketsProps {
  markets?: FeaturedMarket[];
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

  const fetchedMarkets = useFeaturedMarkets(marketsProp ? undefined : onLoad);
  const markets   = marketsProp ?? fetchedMarkets ?? [];
  const isLoading = !marketsProp && fetchedMarkets === null;

  const dragStart = useRef<number | null>(null);
  const total     = markets.length;

  const prev = useCallback(
    () => setIndex((index - 1 + Math.max(1, total)) % Math.max(1, total)),
    [index, total, setIndex]
  );
  const next = useCallback(
    () => setIndex((index + 1) % Math.max(1, total)),
    [index, total, setIndex]
  );

  useEffect(() => {
    if (paused || isLoading || total <= 1) return;
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
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <SkeletonCard />
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-white/[0.06]"
        style={{ fontFamily: "'DM Sans', sans-serif", minHeight: 360, background: "linear-gradient(160deg, #0f1117 0%, #0c0d10 100%)" }}
      >
        <p className="text-gray-600 text-sm">No featured markets available.</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Carousel controls — top-right of the card */}
      {total > 1 && (
        <div className="absolute top-5 right-5 z-20 flex items-center gap-3">
          <button
            onClick={() => { prev(); setPaused(true); }}
            aria-label="Previous"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/25 transition"
          >
            ‹
          </button>
          <span className="text-[13px] text-gray-400 tabular-nums select-none">
            {index + 1} of {total}
          </span>
          <button
            onClick={() => { next(); setPaused(true); }}
            aria-label="Next"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/25 transition"
          >
            ›
          </button>
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex"
          style={{
            transform:  `translateX(-${index * 100}%)`,
            transition: "transform 450ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {markets.map((m, i) => (
            <div key={m.id} className="min-w-full">
              <MarketCard market={m} active={i === index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
