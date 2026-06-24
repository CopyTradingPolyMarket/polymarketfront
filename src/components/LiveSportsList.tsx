"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import GameCard from "./GameCard";
import type { Game } from "./GameCard";
import SportsSidebar from "./SportsSidebar";
import type { LeagueItem } from "./SportsSidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const LEAGUE_LABELS: Record<string, string> = {
  fifwc: "World Cup",
  mlb: "MLB",
  wnba: "WNBA",
  nba: "NBA",
  nfl: "NFL",
  nhl: "NHL",
  atp: "ATP",
  wta: "WTA",
  "wta challenger": "WTA Challenger",
  "grand slam": "Grand Slam",
  cs2: "CS2",
  val: "Valorant",
  r6siege: "Rainbow Six",
  dota2: "Dota 2",
  lol: "League of Legends",
  codmw: "Call of Duty",
  ow: "Overwatch",
  ufc: "UFC",
  mlbb: "Mobile Legends",
  hok: "Honor of Kings",
  challenger: "Challenger",
};

function leagueLabel(code: string): string {
  return LEAGUE_LABELS[code.toLowerCase()] ?? code.toUpperCase();
}

interface LeagueGroup {
  code: string;
  label: string;
  games: Game[];
  hasLive: boolean;
}

function buildGroups(games: Game[]): LeagueGroup[] {
  const map = new Map<string, Game[]>();
  for (const g of games) {
    const key = g.league.toLowerCase();
    const arr = map.get(key);
    if (arr) arr.push(g);
    else map.set(key, [g]);
  }
  const groups: LeagueGroup[] = [];
  for (const [code, list] of map) {
    list.sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      return 0;
    });
    groups.push({ code, label: leagueLabel(code), games: list, hasLive: list.some((g) => g.live) });
  }
  groups.sort((a, b) => {
    if (a.hasLive !== b.hasLive) return a.hasLive ? -1 : 1;
    return b.games.length - a.games.length;
  });
  return groups;
}

export default function LiveSportsList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);

  const updateGame = useCallback((update: Partial<Game> & { gameId: number | string }) => {
    setGames((prev) => {
      const idx = prev.findIndex((g) => String(g.gameId) === String(update.gameId));
      if (idx === -1) {
        const newGame: Game = {
          gameId: update.gameId,
          league: update.league ?? "",
          slug: null,
          homeTeam: update.homeTeam ?? "",
          awayTeam: update.awayTeam ?? "",
          status: update.status ?? null,
          score: update.score ?? null,
          period: update.period ?? null,
          elapsed: null,
          turn: null,
          live: update.live ?? false,
          ended: update.ended ?? false,
          markets: [],
        };
        return [...prev, newGame];
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...update };
      return updated;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/games/live`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Game[]) => { if (!cancelled) { setGames(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(`${WS_BASE}/ws/sports`);
      wsRef.current = ws;
      ws.onopen = () => { backoffRef.current = 1000; };
      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === "game_update") updateGame(msg);
        } catch { /* ignore */ }
      };
      ws.onclose = () => {
        if (cancelled) return;
        reconnectRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, 30000);
          connect();
        }, backoffRef.current);
      };
      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [updateGame]);

  const allGroups = useMemo(() => buildGroups(games), [games]);

  const filteredGroups = useMemo(() => {
    if (!activeLeague) return allGroups;
    return allGroups.filter((g) => g.code === activeLeague);
  }, [allGroups, activeLeague]);

  const sidebarLeagues: LeagueItem[] = useMemo(() =>
    allGroups.map((g) => ({ code: g.code, label: g.label, count: g.games.length, hasLive: g.hasLive })),
  [allGroups]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-[#111113] p-4 animate-pulse">
            <div className="h-3 rounded w-1/4 mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex items-center gap-3">
              <div className="w-[200px] space-y-2">
                <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <div className="flex-1 flex gap-2">
                <div className="flex-1 h-12 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1 h-12 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1 h-12 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <p className="text-gray-400 text-sm">Couldn&apos;t load live games.</p>
          <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (allGroups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <p className="text-gray-400 text-sm">No live games right now.</p>
          <p className="text-gray-600 text-xs mt-1">Check back when matches are underway.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:block w-[180px] shrink-0 sticky top-4 self-start">
        <SportsSidebar
          leagues={sidebarLeagues}
          totalGames={games.length}
          activeLeague={activeLeague}
          onSelect={setActiveLeague}
        />
      </div>

      {/* Mobile league pills */}
      <div className="lg:hidden w-full">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-4 pb-1">
          <button
            onClick={() => setActiveLeague(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              !activeLeague ? "bg-white/10 text-white" : "bg-white/[0.04] text-gray-400"
            }`}
          >
            All
          </button>
          {sidebarLeagues.map((lg) => (
            <button
              key={lg.code}
              onClick={() => setActiveLeague(lg.code)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap ${
                activeLeague === lg.code ? "bg-white/10 text-white" : "bg-white/[0.04] text-gray-400"
              }`}
            >
              {lg.label} {lg.count}
            </button>
          ))}
        </div>

        {/* Games (mobile — no market columns) */}
        <div className="space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.code}>
              <div className="flex items-center gap-2 mb-2 px-1">
                {group.hasLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">{group.label}</h3>
              </div>
              <div className="space-y-2">
                {group.games.map((game) => (
                  <GameCard key={game.gameId} game={game} showColumns={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Games column — desktop */}
      <div className="hidden lg:block flex-1 min-w-0 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.code}>
            {/* League header with column labels */}
            <div className="flex items-center gap-4 mb-2 px-1">
              <div className="w-[200px] shrink-0 flex items-center gap-2">
                {group.hasLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                <span className="text-[11px] text-gray-600">{group.games.length}</span>
              </div>
              <div className="flex-1 flex gap-2">
                <span className="flex-1 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Moneyline</span>
                <span className="flex-1 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Spread</span>
                <span className="flex-1 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Total</span>
              </div>
            </div>

            <div className="space-y-2">
              {group.games.map((game) => (
                <GameCard key={game.gameId} game={game} showColumns={true} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
