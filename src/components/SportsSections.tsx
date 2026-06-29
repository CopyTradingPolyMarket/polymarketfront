"use client";

import React, { useState } from "react";

interface Opt { label: string; probability: number }
export interface Mkt {
  id: string; title: string; slug: string | null; volume: number;
  sportsMarketType: string | null; line: number | null; options: Opt[];
  groupItemTitle?: string | null;
}

export const TYPE_ORDER = [
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

export function typeLabel(t: string) { return TYPE_LABEL[t] ?? t.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase()); }

export interface MktGroup { type: string; label: string; markets: Mkt[] }

export function groupMarkets(markets: Mkt[]): MktGroup[] {
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

export function isSportsEvent(markets: Mkt[]): boolean {
  return markets.some(m => m.sportsMarketType != null);
}

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

function PriceBtn({ label, cents, lead, selected, onClick }: { label: string; cents: number; lead: boolean; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-lg px-2 py-2 text-center transition-all cursor-pointer ${
      selected ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/40" :
      lead ? "bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25" :
      "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
    }`}>
      <div className="text-[11px] font-semibold truncate">{label}</div>
      <div className={`text-[13px] font-bold tabular-nums ${selected ? "text-blue-300" : lead ? "text-blue-300" : "text-gray-300"}`}>{cents}¢</div>
    </button>
  );
}

export function MoneylineSection({ markets, home, away, onSelect, selectedId }: { markets: Mkt[]; home: string; away: string; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
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

export function ScaleSection({ markets, type, onSelect, selectedId }: { markets: Mkt[]; type: "sp"|"tot"; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
  const lines = [...new Set(markets.map(m => m.line).filter((l): l is number => l !== null))].sort((a,b) => a-b);
  const [activeLine, setActiveLine] = useState<number|null>(lines[0]??null);
  const active = markets.find(m => m.line === activeLine) ?? markets[0];

  if (!active || active.options.length < 2) return null;
  const o = active.options;
  const p0 = Math.round(o[0].probability), p1 = Math.round(o[1].probability);
  let l0: string, l1: string;
  if (type === "sp") {
    const ln = active.line ?? 0;
    l0 = `${o[0].label} ${ln>0?"+":""}${ln}`;
    l1 = `${o[1].label} ${ln>0?"-":"+"}${Math.abs(ln)}`;
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

export function GenericSection({ markets, onSelect, selectedId }: { markets: Mkt[]; onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null }) {
  return (
    <div className="space-y-2">
      {markets.map(m => {
        const p0 = Math.round(m.options[0]?.probability??0), p1 = Math.round(m.options[1]?.probability??0);
        const shortTitle = m.groupItemTitle ?? m.title.split(":").pop()?.trim() ?? m.title;
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

export function SportsMarketSections({ markets, homeTeam, awayTeam, onSelect, selectedId }: {
  markets: Mkt[]; homeTeam: string; awayTeam: string;
  onSelect: (m: Mkt, side: "yes"|"no") => void; selectedId: string | null;
}) {
  const groups = groupMarkets(markets);
  return (
    <>
      {groups.map(group => (
        <div key={group.type} className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-gray-300">{group.label}</h3>
            <span className="text-[11px] text-gray-600">{group.markets.length} market{group.markets.length !== 1 ? "s" : ""}</span>
          </div>
          {group.type === "moneyline" ? (
            <MoneylineSection markets={group.markets} home={homeTeam} away={awayTeam} onSelect={onSelect} selectedId={selectedId} />
          ) : group.type === "spreads" || group.type === "baseball_team_first_five_spread" ? (
            <ScaleSection markets={group.markets} type="sp" onSelect={onSelect} selectedId={selectedId} />
          ) : group.type === "totals" || group.type.includes("total") ? (
            <ScaleSection markets={group.markets} type="tot" onSelect={onSelect} selectedId={selectedId} />
          ) : (
            <GenericSection markets={group.markets} onSelect={onSelect} selectedId={selectedId} />
          )}
        </div>
      ))}
    </>
  );
}
