"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
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

// ─── League / sport helpers ──────────────────────────────────────────────────

const LEAGUE: Record<string, string> = {
  fifwc:"FIFA World Cup",mlb:"MLB",wnba:"WNBA",nba:"NBA",atp:"ATP",wta:"WTA",
  "grand slam":"Grand Slam",cs2:"CS2",val:"Valorant",dota2:"Dota 2",
  lol:"League of Legends",ufc:"UFC",challenger:"Challenger",nhl:"NHL",
};
function leagueName(c: string) { return LEAGUE[c.toLowerCase()] ?? c.toUpperCase(); }

type SportKind = "tennis" | "soccer" | "basketball" | "baseball" | "hockey" | "mma" | "esports" | "generic";

function sportKind(league: string): SportKind {
  const l = league.toLowerCase();
  if (["atp","wta","grand slam","challenger"].includes(l)) return "tennis";
  if (["fifwc"].includes(l)) return "soccer";
  if (["nba","wnba"].includes(l)) return "basketball";
  if (["mlb"].includes(l)) return "baseball";
  if (["nhl"].includes(l)) return "hockey";
  if (["ufc"].includes(l)) return "mma";
  if (["cs2","val","dota2","lol"].includes(l)) return "esports";
  return "generic";
}

function abbr(n: string) {
  if (!n) return "—";
  if (n.length <= 4) return n.toUpperCase();
  const w = n.split(/\s+/);
  return w.length >= 2 ? w.map(x=>x[0]).join("").toUpperCase().slice(0,3) : n.slice(0,3).toUpperCase();
}

function extractMlLabel(title: string) {
  if (/\bdraw\b|\btie\b/i.test(title)) return "Draw";
  const m = title.match(/^Will (.+?) win\b/i);
  return m ? m[1] : title.split(":")[0].trim();
}

// Backend sends `score` as one string. We assume comma/slash/pipe separated
// segments (one per set / period / inning), each "home-away".
// tennis "6-3, 6-4, 2-1, 0-15" → [[6,3],[6,4],[2,1],[0,15]]   soccer "2-1" → [[2,1]]
// Tweak the split() calls if your API formats scores differently.
function parseScoreSegments(raw: string | null): [string, string][] {
  if (!raw) return [];
  return raw
    .split(/[,/|]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(seg => {
      const p = seg.split(/[-–:]/).map(x => x.trim());
      return [p[0] ?? "", p[1] ?? ""] as [string, string];
    });
}

function statusLabel(g: GameData) {
  const p: string[] = [];
  if (g.period) p.push(g.period);
  if (g.elapsed) p.push(g.elapsed.includes("'") ? g.elapsed : `${g.elapsed}'`);
  if (p.length) return p.join(" ");
  if (g.status && g.status.toLowerCase() !== "inprogress") return g.status;
  return g.live ? "Live" : g.ended ? "Final" : "Upcoming";
}

function round1(v: number): number { return Math.round(v * 10) / 10; }

// ─── Flag / avatar ───────────────────────────────────────────────────────────

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-white/[0.07] flex items-center justify-center font-bold text-gray-300 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {abbr(name)}
    </div>
  );
}

// ─── Scoreboard (sport-specific) ─────────────────────────────────────────────

function ScoreBoard({ game }: { game: GameData }) {
  const kind = sportKind(game.league);
  const segs = parseScoreSegments(game.score);
  const live = game.live;
  const status = statusLabel(game);

  const LiveTag = (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      {live && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      <span className={`text-[12px] font-bold tracking-wide uppercase ${live ? "text-red-400" : "text-gray-500"}`}>{status}</span>
    </div>
  );

  // ── Tennis / esports: row per competitor, big set numbers, current period boxed ──
  if ((kind === "tennis" || kind === "esports") && segs.length > 0) {
    const lastIdx = segs.length - 1;

    const Row = ({ name, mine, theirs }: { name: string; mine: string[]; theirs: string[] }) => (
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold text-gray-200 w-[180px] truncate">{name}</span>
        <div className="flex items-center gap-1.5 ml-auto">
          {mine.map((v, i) => {
            const isLive = i === lastIdx && live;
            const won = !isLive && Number(v) > Number(theirs[i] ?? 0);
            return (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center text-[17px] tabular-nums rounded-md ${
                  isLive
                    ? "bg-blue-500/15 border border-blue-500/40 text-blue-300 font-bold"
                    : won ? "text-white font-bold" : "text-gray-500 font-medium"
                }`}
              >
                {v}
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div>
        {LiveTag}
        <div className="max-w-md mx-auto space-y-2.5">
          <Row name={game.homeTeam} mine={segs.map(s=>s[0])} theirs={segs.map(s=>s[1])} />
          <Row name={game.awayTeam} mine={segs.map(s=>s[1])} theirs={segs.map(s=>s[0])} />
        </div>
      </div>
    );
  }

  // ── Everything else: big centered H – A ──
  const main = segs[0] ?? ["–", "–"];
  return (
    <div>
      {LiveTag}
      <div className="flex items-center justify-center gap-8 md:gap-14">
        <div className="text-center">
          <Avatar name={game.homeTeam} size={44} />
          <p className="text-[13px] font-semibold text-gray-200 mt-2">{game.homeTeam}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[42px] leading-none font-extrabold tabular-nums">{main[0]}</span>
          <span className="text-[20px] text-gray-600">–</span>
          <span className="text-[42px] leading-none font-extrabold tabular-nums">{main[1]}</span>
        </div>
        <div className="text-center">
          <Avatar name={game.awayTeam} size={44} />
          <p className="text-[13px] font-semibold text-gray-200 mt-2">{game.awayTeam}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Market grouping ────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string,string> = {
  moneyline:"Winner", spreads:"Spread", totals:"Total",
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

function byType(markets: Mkt[]): Map<string, Mkt[]> {
  const map = new Map<string, Mkt[]>();
  for (const m of markets) {
    const t = m.sportsMarketType ?? "other";
    const arr = map.get(t); if (arr) arr.push(m); else map.set(t, [m]);
  }
  return map;
}

// ─── Chart ──────────────────────────────────────────────────────────────────

type Range = "1H"|"6H"|"1D"|"1W"|"1M"|"ALL";
const RANGE_API: Record<Range,string> = { "1H":"1h","6H":"6h","1D":"1d","1W":"1w","1M":"1m","ALL":"all" };
// Blue brand: leader = bright blue, runner-up = light gray/white, third = slate.
const COLORS = ["#3b82f6","#e5e7eb","#64748b"];
interface ChartPt { date: string; [key: string]: number | string }

// ─── Outcome row (Kalshi-style, flat) ────────────────────────────────────────

function Delta({ value }: { value?: number }) {
  if (value === undefined || Math.abs(value) < 0.5) return null;
  const up = value >= 0;
  return (
    <span className={`text-[11px] font-semibold tabular-nums ${up ? "text-blue-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(value))}
    </span>
  );
}

function YesNo({
  yesCents, noCents, onYes, onNo, selYes, selNo,
}: {
  yesCents: number; noCents: number;
  onYes: () => void; onNo: () => void; selYes?: boolean; selNo?: boolean;
}) {
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={onYes} className={`w-[104px] rounded-lg px-3 py-2.5 text-[13px] font-semibold text-left transition-colors ${
        selYes ? "bg-blue-500/25 text-blue-200 ring-1 ring-blue-400/50"
               : "bg-blue-500/[0.08] text-blue-300 hover:bg-blue-500/[0.16]"}`}>
        Yes <span className="float-right tabular-nums font-bold">{yesCents.toFixed(0)}¢</span>
      </button>
      <button onClick={onNo} className={`w-[104px] rounded-lg px-3 py-2.5 text-[13px] font-semibold text-left transition-colors ${
        selNo ? "bg-red-500/25 text-red-200 ring-1 ring-red-400/50"
              : "bg-red-500/[0.08] text-red-300 hover:bg-red-500/[0.16]"}`}>
        No <span className="float-right tabular-nums font-bold">{noCents.toFixed(0)}¢</span>
      </button>
    </div>
  );
}

function OutcomeRow({
  label, sublabel, avatar, pct, delta, lineSelector,
  yesCents, noCents, onYes, onNo, selYes, selNo,
}: {
  label: React.ReactNode; sublabel?: string; avatar?: string;
  pct: number; delta?: number; lineSelector?: React.ReactNode;
  yesCents: number; noCents: number;
  onYes: () => void; onNo: () => void; selYes?: boolean; selNo?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {avatar !== undefined && <Avatar name={avatar} size={28} />}
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-gray-100 truncate">{label}</div>
          {sublabel && <p className="text-[11px] text-gray-500 truncate">{sublabel}</p>}
          {lineSelector}
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end shrink-0">
        <span className="text-[18px] font-bold tabular-nums text-white">{Math.round(pct)}%</span>
        <Delta value={delta} />
      </div>
      <YesNo yesCents={yesCents} noCents={noCents} onYes={onYes} onNo={onNo} selYes={selYes} selNo={selNo} />
    </div>
  );
}

// Pill line selector with ‹ › arrows (spreads / totals)
function LinePills({ lines, active, setActive, fmt }: {
  lines: number[]; active: number | null; setActive: (n: number)=>void; fmt: (n:number)=>string;
}) {
  if (lines.length <= 1) return null;
  const idx = lines.findIndex(l => l === active);
  const go = (d: number) => { const ni = Math.min(lines.length-1, Math.max(0, idx + d)); setActive(lines[ni]); };
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <button onClick={()=>go(-1)} disabled={idx<=0} className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 disabled:opacity-30">‹</button>
      {lines.map(ln => (
        <button key={ln} onClick={()=>setActive(ln)} className={`px-2 py-0.5 rounded text-[12px] font-semibold tabular-nums transition-colors ${
          active===ln ? "text-blue-300" : "text-gray-600 hover:text-gray-400"}`}>{fmt(ln)}</button>
      ))}
      <button onClick={()=>go(1)} disabled={idx>=lines.length-1} className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 disabled:opacity-30">›</button>
    </div>
  );
}

interface SelState { id: string | null; side: "yes" | "no" }

// ── Winner (moneyline) rows ──
function WinnerRows({ markets, home, deltaByLabel, onSelect, sel }: {
  markets: Mkt[]; home: string; deltaByLabel: Record<string, number>;
  onSelect: (m: Mkt, side: "yes"|"no")=>void; sel: SelState;
}) {
  if (markets.length >= 3) {
    const rows = markets.map(m => {
      const isDraw = /\bdraw\b|\btie\b/i.test(m.title);
      const label = isDraw ? "Draw" : extractMlLabel(m.title);
      const order = isDraw ? 1 : m.title.toLowerCase().includes(home.toLowerCase()) ? 0 : 2;
      const yes = round1(m.options[0]?.probability ?? 0);
      return { m, label, order, yes };
    }).sort((a,b)=>a.order-b.order);
    return (<div className="divide-y divide-white/[0.05]">
      {rows.map(({m,label,yes})=>(
        <OutcomeRow key={m.id} label={label} avatar={label} pct={yes} delta={deltaByLabel[label]}
          yesCents={yes} noCents={round1(100-yes)}
          onYes={()=>onSelect(m,"yes")} onNo={()=>onSelect(m,"no")}
          selYes={sel.id===m.id&&sel.side==="yes"} selNo={sel.id===m.id&&sel.side==="no"} />
      ))}
    </div>);
  }
  if (markets.length === 1) {
    const m = markets[0];
    const p0 = round1(m.options[0]?.probability ?? 0), p1 = round1(m.options[1]?.probability ?? 0);
    const l0 = m.options[0]?.label ?? home, l1 = m.options[1]?.label ?? "Away";
    return (<div className="divide-y divide-white/[0.05]">
      <OutcomeRow label={l0} avatar={l0} pct={p0} delta={deltaByLabel[l0]} yesCents={p0} noCents={p1}
        onYes={()=>onSelect(m,"yes")} onNo={()=>onSelect(m,"no")}
        selYes={sel.id===m.id&&sel.side==="yes"} selNo={sel.id===m.id&&sel.side==="no"} />
      <OutcomeRow label={l1} avatar={l1} pct={p1} delta={deltaByLabel[l1]} yesCents={p1} noCents={p0}
        onYes={()=>onSelect(m,"no")} onNo={()=>onSelect(m,"yes")}
        selYes={sel.id===m.id&&sel.side==="no"} selNo={sel.id===m.id&&sel.side==="yes"} />
    </div>);
  }
  return null;
}

// ── Scale row (spread / total) with line pills ──
function ScaleRow({ markets, home, away, type, onSelect, sel }: {
  markets: Mkt[]; home: string; away: string; type: "sp"|"tot";
  onSelect: (m: Mkt, side: "yes"|"no")=>void; sel: SelState;
}) {
  const lines = [...new Set(markets.map(m=>m.line).filter((l): l is number => l!==null))].sort((a,b)=>a-b);
  const [active, setActive] = useState<number|null>(lines[0] ?? null);
  const m = markets.find(x=>x.line===active) ?? markets[0];
  if (!m || m.options.length < 2) return null;
  const p0 = round1(m.options[0].probability), p1 = round1(m.options[1].probability);
  const ln = m.line ?? 0;
  const titleNode = type==="sp"
    ? (<><span className="text-gray-100">{home} </span><span className="text-blue-400 font-semibold">{ln>0?`+${ln}`:ln}</span><span className="text-gray-500"> games</span></>)
    : (<><span className="text-gray-100">Over </span><span className="text-blue-400 font-semibold">{ln}</span><span className="text-gray-500"> games</span></>);
  const l0 = type==="sp" ? `${abbr(home)} ${ln>0?"+":""}${ln}` : `Over ${ln}`;
  const l1 = type==="sp" ? `${abbr(away)} ${ln>0?"-":"+"}${Math.abs(ln)}` : `Under ${ln}`;
  return (
    <OutcomeRow
      label={titleNode}
      lineSelector={<LinePills lines={lines} active={active} setActive={setActive} fmt={(n)=>type==="sp"?(n>0?`+${n}`:`${n}`):`${n}`} />}
      pct={p0} yesCents={p0} noCents={p1}
      onYes={()=>onSelect(m,"yes")} onNo={()=>onSelect(m,"no")}
      selYes={sel.id===m.id&&sel.side==="yes"} selNo={sel.id===m.id&&sel.side==="no"} />
  );
}

// ── Tabbed prop markets (Exact Score / Set Winner / Total Games …) ──
function TabbedProps({ groups, onSelect, sel }: {
  groups: { type: string; label: string; markets: Mkt[] }[];
  onSelect: (m: Mkt, side: "yes"|"no")=>void; sel: SelState;
}) {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(false);
  if (groups.length === 0) return null;
  const active = groups[Math.min(tab, groups.length-1)];
  const visible = expanded ? active.markets : active.markets.slice(0, 3);
  return (
    <section className="pt-8">
      <div className="flex items-center gap-5 mb-4 overflow-x-auto scrollbar-none">
        {groups.map((g, i) => (
          <button key={g.type} onClick={()=>{setTab(i);setExpanded(false);}}
            className={`text-[18px] font-bold whitespace-nowrap transition-colors ${i===tab ? "text-white" : "text-gray-600 hover:text-gray-400"}`}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="divide-y divide-white/[0.05]">
        {visible.map(m => {
          const p0 = round1(m.options[0]?.probability ?? 0), p1 = round1(m.options[1]?.probability ?? 0);
          const short = m.title.split(":").pop()?.trim() ?? m.title;
          return (
            <OutcomeRow key={m.id} label={short} avatar={short} pct={p0} yesCents={p0} noCents={p1}
              onYes={()=>onSelect(m,"yes")} onNo={()=>onSelect(m,"no")}
              selYes={sel.id===m.id&&sel.side==="yes"} selNo={sel.id===m.id&&sel.side==="no"} />
          );
        })}
      </div>
      {active.markets.length > 3 && (
        <button onClick={()=>setExpanded(e=>!e)} className="mt-3 text-[13px] font-semibold text-gray-400 hover:text-gray-200">
          {expanded ? "Show less" : `${active.markets.length - 3} more`}
        </button>
      )}
    </section>
  );
}

// ─── Bet Panel ──────────────────────────────────────────────────────────────

function BetPanel({ market, side, setSide, vs }: { market: Mkt | null; side:"yes"|"no"; setSide:(s:"yes"|"no")=>void; vs: string }) {
  const [mode, setMode] = useState<"buy"|"sell">("buy");
  const [amount, setAmount] = useState("");

  return (
    <div className="space-y-3">
      <button className="w-full py-3 rounded-2xl border border-white/[0.08] bg-[#0f0f12] text-[13px] font-bold text-gray-300 hover:bg-white/[0.03] flex items-center justify-center gap-2">
        <span className="text-blue-400">◈</span> COMBO
      </button>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f12] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            {(["buy","sell"] as const).map(mm => (
              <button key={mm} onClick={()=>setMode(mm)} className={`text-[13px] font-bold tracking-wide uppercase transition-colors ${mode===mm ? "text-white" : "text-gray-600 hover:text-gray-400"}`}>{mm}</button>
            ))}
          </div>
          <span className="text-[12px] text-gray-500 font-medium">Dollars ▾</span>
        </div>

        {!market ? (
          <p className="text-gray-500 text-[13px] text-center py-10">Select an outcome to trade</p>
        ) : (() => {
          const yesOpt = market.options[0], noOpt = market.options[1];
          const cents = side==="yes" ? (yesOpt?.probability ?? 50) : (noOpt?.probability ?? 50);
          const shares = cents>0 ? (Number(amount)||0)/(cents/100) : 0;
          return (<>
            <p className="text-[12px] text-gray-500 mb-1 truncate">{vs}</p>
            <div className="flex items-center gap-2 mb-4">
              <Avatar name={side==="yes" ? (yesOpt?.label ?? "Yes") : (noOpt?.label ?? "No")} size={24} />
              <p className="text-[16px] font-bold text-white truncate">{side==="yes" ? (yesOpt?.label ?? "Yes") : (noOpt?.label ?? "No")}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={()=>setSide("yes")} className={`py-2.5 rounded-xl text-[13px] font-bold transition-colors ${side==="yes" ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40" : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.07]"}`}>
                YES <span className="tabular-nums">{round1(yesOpt?.probability ?? 0).toFixed(0)}¢</span>
              </button>
              <button onClick={()=>setSide("no")} className={`py-2.5 rounded-xl text-[13px] font-bold transition-colors ${side==="no" ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40" : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.07]"}`}>
                NO <span className="tabular-nums">{round1(noOpt?.probability ?? 0).toFixed(0)}¢</span>
              </button>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] pointer-events-none">Dollars</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-[15px] font-bold pointer-events-none">$</span>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder=""
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-20 pr-7 py-3 text-white text-[15px] font-bold text-right outline-none focus:border-blue-500/40 tabular-nums" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">Odds</span>
                <span className="text-[13px] font-semibold text-gray-300 tabular-nums">{Math.round(cents)}% chance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">Max payout</span>
                <span className="text-[18px] font-extrabold text-white tabular-nums">${shares.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-bold transition-colors">
              Connect wallet to trade
            </button>
          </>);
        })()}
      </div>
    </div>
  );
}

// ─── End-of-line label dot for the chart ─────────────────────────────────────

function makeEndDot(label: string, color: string, lastIndex: number) {
  return (props: any) => {
    const { cx, cy, index, value } = props;
    if (index !== lastIndex || cx == null) return <g key={`g${index}`} />;
    return (
      <g key={`end${index}`}>
        <circle cx={cx} cy={cy} r={3.5} fill={color} />
        <text x={cx + 8} y={cy - 5} fill={color} fontSize={11} fontWeight={700}>{label}</text>
        <text x={cx + 8} y={cy + 10} fill={color} fontSize={13} fontWeight={800}>{Math.round(value)}%</text>
      </g>
    );
  };
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

  const [sel, setSel] = useState<SelState>({ id: null, side: "yes" });
  const [selSide, setSelSide] = useState<"yes"|"no">("yes");
  const selectedMarket = useMemo(() => (game?.markets ?? []).find(m => m.id === sel.id) ?? null, [game, sel.id]);

  useEffect(() => {
    if (!gameId) return;
    fetch(`${API}/api/games/${gameId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: GameData) => { setGame(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [gameId]);

  const mlMarkets = useMemo(() => (game?.markets ?? []).filter(m => m.sportsMarketType === "moneyline"), [game]);

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
      setChartData(sorted.map(([t, vals]) => ({ date: formatRangeDate(t, apiRange), ...vals })));
      setChartLabels(labels);
    });
  }, [mlMarkets, range]);

  const { latestByLabel, deltaByLabel } = useMemo(() => {
    const latest: Record<string, number> = {}, delta: Record<string, number> = {};
    for (const label of chartLabels) {
      const vals = chartData.map(d => d[label]).filter(v => typeof v === "number") as number[];
      if (vals.length) { latest[label] = vals[vals.length-1]; delta[label] = vals[vals.length-1]-vals[0]; }
    }
    return { latestByLabel: latest, deltaByLabel: delta };
  }, [chartData, chartLabels]);

  // Section split: Winner | Spread&Total | the rest (tabbed)
  const sections = useMemo(() => {
    const map = byType(game?.markets ?? []);
    const winner = map.get("moneyline") ?? [];
    const spreadTypes = ["spreads","baseball_team_first_five_spread"];
    const totalTypes  = ["totals","first_half_totals","second_half_totals","soccer_team_totals","baseball_team_first_five_total","total_corners","soccer_team_total_corners"];
    const spread = spreadTypes.flatMap(t => map.get(t) ?? []);
    const total  = totalTypes.flatMap(t => map.get(t) ?? []);
    const used = new Set(["moneyline", ...spreadTypes, ...totalTypes]);
    const rest = [...map.entries()].filter(([t])=>!used.has(t))
      .map(([t, markets]) => ({ type: t, label: typeLabel(t), markets }));
    return { winner, spread, total, rest };
  }, [game]);

  const handleSelect = (m: Mkt, side: "yes"|"no") => { setSel({ id: m.id, side }); setSelSide(side); };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
  if (error || !game) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center"><p className="text-gray-400">Game not found</p></div>
  );

  const totalVol = game.markets.reduce((s, m) => s + (m.volume || 0), 0);
  const lastIdx = chartData.length - 1;
  const vs = `${game.homeTeam} vs ${game.awayTeam}`;

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-28 lg:pb-12">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 lg:items-start">

          {/* LEFT — flat column */}
          <div className="min-w-0">

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[12px] font-extrabold text-blue-400 shrink-0">
                {leagueName(game.league).split(/\s+/).map(w=>w[0]).join("").slice(0,3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-[0.1em] text-gray-500 uppercase">
                  Sports · {leagueName(game.league)}
                </p>
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight truncate">{vs}</h1>
              </div>
              <div className="hidden sm:flex items-center gap-1 shrink-0 text-gray-500">
                {["▦","💬","↗","⤓"].map((ic,i)=>(
                  <button key={i} className="w-9 h-9 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-[14px]">{ic}</button>
                ))}
              </div>
            </div>

            {/* Scoreboard */}
            <div className="mt-7 mb-6"><ScoreBoard game={game} /></div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5"><span className="text-gray-600">▥</span> Stats</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 84, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 5))} />
                    <YAxis domain={[0,100]} orientation="right" tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={36} ticks={[0,25,50,75,100]} />
                    <Tooltip contentStyle={{ background: "rgba(10,10,13,0.95)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, fontSize: 12 }} />
                    {chartLabels.map((label, i) => (
                      <Line key={label} type="monotone" dataKey={label} stroke={COLORS[i % COLORS.length]} strokeWidth={2} isAnimationActive={false}
                        dot={makeEndDot(label, COLORS[i % COLORS.length], lastIdx)} activeDot={{ r: 4, strokeWidth: 0 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[12px] text-gray-500 tabular-nums">{totalVol>0 ? `${formatVolume(totalVol,{thousandDigits:1})} vol` : ""}</span>
                  <div className="flex gap-3">
                    {(["1H","6H","1D","1W","1M","ALL"] as Range[]).map(r => (
                      <button key={r} onClick={()=>setRange(r)} className={`text-[12px] font-bold transition-colors ${range===r ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chance (winner) */}
            {sections.winner.length > 0 && (
              <section className="border-t border-white/[0.06] mt-6 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-gray-500">Chance</span>
                  <span className="text-gray-600 text-[13px]">⇅</span>
                </div>
                <WinnerRows markets={sections.winner} home={game.homeTeam} deltaByLabel={deltaByLabel} onSelect={handleSelect} sel={sel} />
              </section>
            )}

            {/* Spread and Total */}
            {(sections.spread.length > 0 || sections.total.length > 0) && (
              <section className="pt-8">
                <h2 className="text-[18px] font-bold mb-1">Spread and Total</h2>
                <div className="divide-y divide-white/[0.05]">
                  {sections.spread.length > 0 && (
                    <ScaleRow markets={sections.spread} home={game.homeTeam} away={game.awayTeam} type="sp" onSelect={handleSelect} sel={sel} />
                  )}
                  {sections.total.length > 0 && (
                    <ScaleRow markets={sections.total} home={game.homeTeam} away={game.awayTeam} type="tot" onSelect={handleSelect} sel={sel} />
                  )}
                </div>
              </section>
            )}

            {/* Tabbed props (Exact Score / Set Winner / …) */}
            <TabbedProps groups={sections.rest} onSelect={handleSelect} sel={sel} />

            {/* Info */}
            <div className="mt-8 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
              <p className="text-[13px] text-gray-300 leading-relaxed">
                <span className="font-bold text-gray-100">How it settles:</span> live markets update with the game and resolve when the result is final. Prices reflect the current implied chance — they can move fast while the game is in play.
              </p>
            </div>
          </div>

          {/* RIGHT — bet panel */}
          <div className="hidden lg:block sticky top-6 self-start">
            <BetPanel market={selectedMarket} side={selSide} setSide={setSelSide} vs={vs} />
          </div>
        </div>
      </div>

      {/* Mobile bet bar */}
      {selectedMarket && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0f0f12] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-400 truncate">{selectedMarket.title}</p>
              <p className="text-[14px] font-bold text-white">
                {selSide==="yes" ? selectedMarket.options[0]?.label : selectedMarket.options[1]?.label}{" "}
                <span className="tabular-nums text-blue-400">{round1((selSide==="yes" ? selectedMarket.options[0]?.probability : selectedMarket.options[1]?.probability) ?? 0).toFixed(0)}¢</span>
              </p>
            </div>
            <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold shrink-0">Trade</button>
          </div>
        </div>
      )}
    </div>
  );
}