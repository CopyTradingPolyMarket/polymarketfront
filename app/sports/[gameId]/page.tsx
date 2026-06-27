"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

import { API_BASE as API } from "@/src/config/api";
import { formatVolume } from "@/src/utils/formatters";
import { formatRangeDate } from "@/src/utils/dateFormatters";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Opt { label: string; probability: number }
interface Mkt {
  id: string; title: string; slug: string | null; volume: number;
  sportsMarketType: string | null; line: number | null; options: Opt[];
}
interface GameData {
  gameId: number; league: string; slug: string | null;
  homeTeam: string; awayTeam: string; status: string | null;
  score: string | null; period: string | null; elapsed: string | null;
  live: boolean; ended: boolean; markets: Mkt[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const LEAGUE: Record<string, string> = {
  fifwc:"FIFA World Cup",mlb:"MLB",wnba:"WNBA",nba:"NBA",atp:"ATP",wta:"WTA",
  "grand slam":"Grand Slam",cs2:"CS2",val:"Valorant",dota2:"Dota 2",
  lol:"League of Legends",ufc:"UFC",challenger:"Challenger",
};
function leagueName(c: string) { return LEAGUE[c.toLowerCase()] ?? c.toUpperCase(); }

function abbr(n: string) {
  if (n.length <= 4) return n.toUpperCase();
  const w = n.split(/\s+/);
  return w.length >= 2 ? w.map(x=>x[0]).join("").toUpperCase().slice(0,3) : n.slice(0,3).toUpperCase();
}

function extractMlLabel(title: string) {
  if (/\bdraw\b|\btie\b/i.test(title)) return "Draw";
  const m = title.match(/^Will (.+?) win\b/i);
  return m ? m[1] : title.split(":")[0].trim();
}

function parseScore(raw: string|null): [string,string] {
  if (!raw) return ["–","–"];
  const f = raw.split(",")[0].trim();
  const p = f.split("-");
  return p.length >= 2 ? [p[0].trim(), p.slice(1).join("-").trim()] : [raw, ""];
}

function statusLabel(g: GameData) {
  const p: string[] = [];
  if (g.period) p.push(g.period);
  if (g.elapsed) p.push(g.elapsed.includes("'") ? g.elapsed : `${g.elapsed}'`);
  if (p.length) return p.join(" ");
  if (g.status && g.status.toLowerCase() !== "inprogress") return g.status;
  return g.live ? "Live" : g.ended ? "Final" : "Upcoming";
}

// ─── Market grouping ────────────────────────────────────────────────────────

const TYPE_ORDER = [
  "moneyline","spreads","totals","both_teams_to_score","both_teams_to_score_first_half",
  "both_teams_to_score_second_half","soccer_first_to_score","soccer_halftime_result",
  "soccer_second_half_result","soccer_exact_score","soccer_team_totals",
  "first_half_totals","second_half_totals","soccer_first_half_team_totals",
  "soccer_second_half_team_totals","total_corners","soccer_team_total_corners",
  "soccer_first_half_total_corners","soccer_second_half_total_corners",
  "soccer_first_corner","soccer_game_corners_odd_even","nrfi",
  "baseball_game_extra_innings","baseball_team_first_five_winner",
  "baseball_team_first_five_spread","baseball_team_first_five_total",
];

const TYPE_LABEL: Record<string,string> = {
  moneyline:"Moneyline", spreads:"Spreads", totals:"Totals",
  both_teams_to_score:"Both Teams to Score",
  both_teams_to_score_first_half:"BTTS 1st Half",
  both_teams_to_score_second_half:"BTTS 2nd Half",
  soccer_first_to_score:"First to Score",
  soccer_halftime_result:"Halftime Result",
  soccer_second_half_result:"2nd Half Result",
  soccer_exact_score:"Exact Score",
  soccer_team_totals:"Team Totals",
  first_half_totals:"1st Half Totals",
  second_half_totals:"2nd Half Totals",
  soccer_first_half_team_totals:"1st Half Team Totals",
  soccer_second_half_team_totals:"2nd Half Team Totals",
  total_corners:"Total Corners",
  soccer_team_total_corners:"Team Corners",
  soccer_first_half_total_corners:"1st Half Corners",
  soccer_second_half_total_corners:"2nd Half Corners",
  soccer_first_corner:"First Corner",
  soccer_game_corners_odd_even:"Corners Odd/Even",
  nrfi:"No Run First Inning",
  baseball_game_extra_innings:"Extra Innings",
  baseball_team_first_five_winner:"1st 5 Innings Winner",
  baseball_team_first_five_spread:"1st 5 Innings Spread",
  baseball_team_first_five_total:"1st 5 Innings Total",
};

function typeLabel(t: string) { return TYPE_LABEL[t] ?? t.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase()); }

const GAME_LINES = new Set(["moneyline","spreads","totals","both_teams_to_score","both_teams_to_score_first_half","both_teams_to_score_second_half"]);
const EXACT_SCORE = new Set(["soccer_exact_score"]);
const HALVES = new Set(["soccer_halftime_result","soccer_second_half_result","first_half_totals","second_half_totals","soccer_first_half_team_totals","soccer_second_half_team_totals"]);
const CORNERS = new Set(["total_corners","soccer_team_total_corners","soccer_first_half_total_corners","soccer_second_half_total_corners","soccer_first_corner","soccer_game_corners_odd_even"]);

interface TabDef { label: string; filter: Set<string> }
const TABS: TabDef[] = [
  { label: "Game Lines", filter: GAME_LINES },
  { label: "Exact Score", filter: EXACT_SCORE },
  { label: "Halves", filter: HALVES },
  { label: "Corners", filter: CORNERS },
];

interface MktGroup { type: string; label: string; markets: Mkt[] }

function groupMarkets(markets: Mkt[]): MktGroup[] {
  const map = new Map<string, Mkt[]>();
  for (const m of markets) {
    const t = m.sportsMarketType ?? "other";
    const arr = map.get(t);
    if (arr) arr.push(m); else map.set(t, [m]);
  }
  const groups: MktGroup[] = [];
  const added = new Set<string>();
  for (const t of TYPE_ORDER) {
    if (map.has(t)) { groups.push({ type: t, label: typeLabel(t), markets: map.get(t)! }); added.add(t); }
  }
  for (const [t, mkts] of map) {
    if (!added.has(t)) groups.push({ type: t, label: typeLabel(t), markets: mkts });
  }
  return groups;
}

// ─── Chart ──────────────────────────────────────────────────────────────────

type Range = "1H"|"6H"|"1D"|"1W"|"1M"|"ALL";
const RANGE_API: Record<Range,string> = { "1H":"1h","6H":"6h","1D":"1d","1W":"1w","1M":"1m","ALL":"all" };
const COLORS = ["#3b82f6","#f59e0b","#6b7280"];

interface ChartPt { date: string; [key: string]: number | string }

// ─── Sub-components ─────────────────────────────────────────────────────────

function PriceBtn({ label, cents, lead, selected, onClick }: { label: string; cents: number; lead: boolean; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-lg px-2 py-2 text-center transition-all cursor-pointer ${
      selected ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/40" :
      lead ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25" :
      "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
    }`}>
      <div className="text-[11px] font-semibold truncate">{label}</div>
      <div className={`text-[13px] font-bold tabular-nums ${selected ? "text-blue-300" : lead ? "text-emerald-300" : "text-gray-300"}`}>{cents}¢</div>
    </button>
  );
}

function MoneylineSection({ markets, home, away, onSelect, selectedId }: { markets: Mkt[]; home: string; away: string; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
  if (markets.length >= 3) {
    type O = { label: string; cents: number; mkt: Mkt; order: number };
    const outcomes: O[] = markets.map(m => {
      const raw = extractMlLabel(m.title);
      const isDraw = /\bdraw\b|\btie\b/i.test(m.title);
      return { label: isDraw ? "Draw" : raw, cents: Math.round(m.options[0]?.probability ?? 0), mkt: m, order: isDraw ? 1 : m.title.toLowerCase().includes(home.toLowerCase()) ? 0 : 2 };
    });
    outcomes.sort((a,b) => a.order - b.order);
    const max = Math.max(...outcomes.map(o=>o.cents));
    return (
      <div className="flex gap-2">
        {outcomes.map((o,i) => <PriceBtn key={i} label={o.label} cents={o.cents} lead={o.cents===max && max>0} selected={selectedId===o.mkt.id} onClick={()=>onSelect(o.mkt,"yes")} />)}
      </div>
    );
  }
  if (markets.length === 1) {
    const m = markets[0], p0 = Math.round(m.options[0]?.probability??0), p1 = Math.round(m.options[1]?.probability??0);
    return (
      <div className="flex gap-2">
        <PriceBtn label={abbr(home)} cents={p0} lead={p0>p1} selected={selectedId===m.id} onClick={()=>onSelect(m,"yes")} />
        <PriceBtn label={abbr(away)} cents={p1} lead={p1>p0} selected={selectedId===m.id} onClick={()=>onSelect(m,"no")} />
      </div>
    );
  }
  return null;
}

function ScaleSection({ markets, home, away, type, onSelect, selectedId }: { markets: Mkt[]; home: string; away: string; type: "sp"|"tot"; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
  const lines = [...new Set(markets.map(m => m.line).filter((l): l is number => l !== null))].sort((a,b) => a-b);
  const [activeLine, setActiveLine] = useState<number|null>(lines[0]??null);
  const active = markets.find(m => m.line === activeLine) ?? markets[0];

  if (!active || active.options.length < 2) return null;
  const o = active.options;
  const p0 = Math.round(o[0].probability), p1 = Math.round(o[1].probability);
  let l0: string, l1: string;
  if (type === "sp") {
    const ln = active.line ?? 0;
    l0 = `${abbr(o[0].label)} ${ln>0?"+":""}${ln}`;
    l1 = `${abbr(o[1].label)} ${ln>0?"-":"+"}${Math.abs(ln)}`;
  } else {
    l0 = `O ${active.line}`; l1 = `U ${active.line}`;
  }

  return (
    <div>
      {lines.length > 1 && (
        <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-none pb-1">
          {lines.map(ln => (
            <button key={ln} onClick={() => setActiveLine(ln)} className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${activeLine===ln ? "bg-white/10 text-white" : "bg-white/[0.04] text-gray-500 hover:text-gray-300"}`}>
              {type === "sp" ? (ln > 0 ? `+${ln}` : `${ln}`) : ln}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <PriceBtn label={l0} cents={p0} lead={p0>p1} selected={selectedId===active.id} onClick={()=>onSelect(active,"yes")} />
        <PriceBtn label={l1} cents={p1} lead={p1>p0} selected={selectedId===active.id} onClick={()=>onSelect(active,"no")} />
      </div>
    </div>
  );
}

function GenericSection({ markets, onSelect, selectedId }: { markets: Mkt[]; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
  return (
    <div className="space-y-2">
      {markets.map(m => {
        const p0 = Math.round(m.options[0]?.probability??0), p1 = Math.round(m.options[1]?.probability??0);
        const shortTitle = m.title.split(":").pop()?.trim() ?? m.title;
        return (
          <div key={m.id}>
            <p className="text-[11px] text-gray-500 mb-1 truncate">{shortTitle}</p>
            <div className="flex gap-2">
              <PriceBtn label={m.options[0]?.label ?? "Yes"} cents={p0} lead={p0>p1} selected={selectedId===m.id} onClick={()=>onSelect(m,"yes")} />
              <PriceBtn label={m.options[1]?.label ?? "No"} cents={p1} lead={p1>p0} selected={selectedId===m.id} onClick={()=>onSelect(m,"no")} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bet Panel ──────────────────────────────────────────────────────────────

function BetPanel({ market, side }: { market: Mkt | null; side: "yes"|"no" }) {
  const [amount, setAmount] = useState("");
  if (!market) return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
      <p className="text-gray-500 text-sm text-center py-8">Select an outcome to place a trade</p>
    </div>
  );
  const opt = side === "yes" ? market.options[0] : market.options[1];
  const prob = opt?.probability ?? 50;
  const amtNum = Number(amount) || 0;
  const shares = prob > 0 ? (amtNum / (prob / 100)) : 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Trade</p>
      <p className="text-[13px] text-gray-200 font-medium mb-1 truncate">{market.title}</p>
      <div className="flex gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${side==="yes" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {side === "yes" ? opt?.label ?? "Yes" : opt?.label ?? "No"} {Math.round(prob)}¢
        </span>
      </div>
      <div className="mb-3">
        <label className="text-[11px] text-gray-500 font-medium block mb-1">Amount (USD)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-[14px] outline-none focus:border-white/20" />
      </div>
      <div className="flex justify-between text-[12px] text-gray-500 mb-4">
        <span>Potential shares</span><span className="text-gray-300 tabular-nums">{shares.toFixed(2)}</span>
      </div>
      <button className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold transition-colors">
        Connect wallet
      </button>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SportsGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [range, setRange] = useState<Range>("ALL");
  const [chartData, setChartData] = useState<ChartPt[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  const [selectedMarket, setSelectedMarket] = useState<Mkt | null>(null);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [activeTab, setActiveTab] = useState(0);

  // Fetch game
  useEffect(() => {
    if (!gameId) return;
    fetch(`${API}/api/games/${gameId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: GameData) => { setGame(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [gameId]);

  // Moneyline markets for chart
  const mlMarkets = useMemo(() => (game?.markets ?? []).filter(m => m.sportsMarketType === "moneyline"), [game]);

  // Fetch chart data (overlay moneyline histories)
  useEffect(() => {
    if (mlMarkets.length === 0) return;
    const apiRange = RANGE_API[range];
    const labels: string[] = [];
    const fetches = mlMarkets.map(m => {
      const raw = extractMlLabel(m.title);
      const label = /\bdraw\b|\btie\b/i.test(m.title) ? "Draw" : raw;
      labels.push(label);
      return fetch(`${API}/api/markets/by-slug/${m.slug}/history?range=${apiRange}`)
        .then(r => r.ok ? r.json() : { points: [] })
        .then((d: { points: { t: string; p?: number; c?: number }[] }) => d.points ?? []);
    });
    Promise.all(fetches).then(allPts => {
      const timeMap = new Map<string, Record<string, number>>();
      allPts.forEach((pts, i) => {
        for (const pt of pts) {
          const key = pt.t;
          const existing = timeMap.get(key) ?? {};
          existing[labels[i]] = pt.p ?? pt.c ?? 0;
          timeMap.set(key, existing);
        }
      });
      const sorted = [...timeMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const data: ChartPt[] = sorted.map(([t, vals]) => ({ date: formatRangeDate(t, apiRange), ...vals }));
      setChartData(data);
      setChartLabels(labels);
    });
  }, [mlMarkets, range]);

  // Group markets
  const allGroups = useMemo(() => groupMarkets(game?.markets ?? []), [game]);

  // Available tabs (only show tabs that have markets)
  const availTabs = useMemo(() => {
    const types = new Set((game?.markets ?? []).map(m => m.sportsMarketType ?? "other"));
    const tabs: TabDef[] = [];
    for (const t of TABS) {
      if ([...t.filter].some(f => types.has(f))) tabs.push(t);
    }
    // "All" tab for anything not in the defined tabs
    const covered = new Set(TABS.flatMap(t => [...t.filter]));
    const uncovered = [...types].filter(t => !covered.has(t));
    if (uncovered.length > 0 || tabs.length === 0) tabs.push({ label: "All Markets", filter: new Set(["__all__"]) });
    return tabs;
  }, [game]);

  const visibleGroups = useMemo(() => {
    if (availTabs.length === 0) return allGroups;
    const tab = availTabs[activeTab] ?? availTabs[0];
    if (!tab) return allGroups;
    if (tab.filter.has("__all__")) {
      const covered = new Set(TABS.flatMap(t => [...t.filter]));
      return allGroups.filter(g => !covered.has(g.type));
    }
    return allGroups.filter(g => tab.filter.has(g.type));
  }, [allGroups, availTabs, activeTab]);

  const handleSelect = (m: Mkt, side: "yes" | "no") => {
    setSelectedMarket(m); setSelectedSide(side);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
    </div>
  );
  if (error || !game) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
      <p className="text-gray-400">Game not found</p>
    </div>
  );

  const [hs, as] = parseScore(game.score);
  const totalVol = game.markets.reduce((s, m) => s + (m.volume || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <p className="text-[12px] text-gray-500">
          <span className="hover:text-gray-300 cursor-pointer" onClick={() => window.history.back()}>Sports</span>
          <span className="mx-1.5">·</span>
          <span>{leagueName(game.league)}</span>
        </p>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-6">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Home */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[18px] font-bold text-gray-300 mx-auto mb-2">{abbr(game.homeTeam)}</div>
              <p className="text-[14px] font-semibold text-gray-200">{game.homeTeam}</p>
            </div>
            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[36px] font-extrabold tabular-nums">{hs}</span>
                <span className="text-[20px] text-gray-600 font-medium">–</span>
                <span className="text-[36px] font-extrabold tabular-nums">{as}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {game.live && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <span className={`text-[12px] font-semibold ${game.live ? "text-red-400" : "text-gray-500"}`}>{statusLabel(game)}</span>
              </div>
              {totalVol > 0 && <p className="text-[11px] text-gray-600 mt-1">{formatVolume(totalVol, { thousandDigits: 1 })} Vol</p>}
            </div>
            {/* Away */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[18px] font-bold text-gray-300 mx-auto mb-2">{abbr(game.awayTeam)}</div>
              <p className="text-[14px] font-semibold text-gray-200">{game.awayTeam}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] text-gray-400 font-semibold">Probability</p>
                  <div className="flex gap-1">
                    {(["1H","6H","1D","1W","1M","ALL"] as Range[]).map(r => (
                      <button key={r} onClick={() => setRange(r)} className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${range===r ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400"}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 5))} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={35} />
                    <Tooltip contentStyle={{ background: "rgba(10,10,13,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                    {chartLabels.map((label, i) => (
                      <Line key={label} type="monotone" dataKey={label} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category tabs */}
            {availTabs.length > 1 && (
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {availTabs.map((tab, i) => (
                  <button key={tab.label} onClick={() => setActiveTab(i)} className={`shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${activeTab===i ? "bg-white/10 text-white" : "bg-white/[0.03] text-gray-500 hover:text-gray-300"}`}>{tab.label}</button>
                ))}
              </div>
            )}

            {/* Market sections */}
            {visibleGroups.map(group => (
              <div key={group.type} className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-gray-300">{group.label}</h3>
                  <span className="text-[11px] text-gray-600">{group.markets.length} market{group.markets.length !== 1 ? "s" : ""}</span>
                </div>
                {group.type === "moneyline" ? (
                  <MoneylineSection markets={group.markets} home={game.homeTeam} away={game.awayTeam} onSelect={handleSelect} selectedId={selectedMarket?.id ?? null} />
                ) : group.type === "spreads" || group.type === "baseball_team_first_five_spread" ? (
                  <ScaleSection markets={group.markets} home={game.homeTeam} away={game.awayTeam} type="sp" onSelect={handleSelect} selectedId={selectedMarket?.id ?? null} />
                ) : group.type === "totals" || group.type.includes("total") ? (
                  <ScaleSection markets={group.markets} home={game.homeTeam} away={game.awayTeam} type="tot" onSelect={handleSelect} selectedId={selectedMarket?.id ?? null} />
                ) : (
                  <GenericSection markets={group.markets} onSelect={handleSelect} selectedId={selectedMarket?.id ?? null} />
                )}
              </div>
            ))}
          </div>

          {/* Right: bet panel (desktop) */}
          <div className="hidden lg:block w-[300px] shrink-0 sticky top-4 self-start">
            <BetPanel market={selectedMarket} side={selectedSide} />
          </div>
        </div>
      </div>

      {/* Mobile bet panel */}
      {selectedMarket && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0f0f12] p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-[12px] text-gray-400 truncate">{selectedMarket.title}</p>
              <p className="text-[14px] font-bold text-white">{selectedSide === "yes" ? selectedMarket.options[0]?.label : selectedMarket.options[1]?.label} {Math.round((selectedSide === "yes" ? selectedMarket.options[0]?.probability : selectedMarket.options[1]?.probability) ?? 0)}¢</p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold shrink-0">Trade</button>
          </div>
        </div>
      )}
    </div>
  );
}
