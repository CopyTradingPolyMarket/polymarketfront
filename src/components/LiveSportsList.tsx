"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard from "./GameCard";
import type { Game } from "./GameCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const LEAGUE_LABELS: Record<string, string> = {
  fifwc: "FIFA World Cup",
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
  r6siege: "Rainbow Six Siege",
  dota2: "Dota 2",
  lol: "League of Legends",
  codmw: "Call of Duty",
  ow: "Overwatch",
  ufc: "UFC",
  mlbb: "Mobile Legends",
  hok: "Honor of Kings",
  challenger: "Challenger Tour",
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

function groupByLeague(games: Game[]): LeagueGroup[] {
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
      .then((data: Game[]) => {
        if (!cancelled) { setGames(data); setLoading(false); }
      })
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
          if (msg.type === "game_update") {
            updateGame(msg);
          }
        } catch { /* ignore malformed */ }
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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-[#111113] p-4 animate-pulse">
            <div className="h-3 rounded w-1/4 mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="w-20 h-8 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex-1 h-4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
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

  const groups = groupByLeague(games);

  if (groups.length === 0) {
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
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.code}>
          {/* League header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            {group.hasLive && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </h3>
            <span className="text-[11px] text-gray-600">
              {group.games.length} {group.games.length === 1 ? "game" : "games"}
            </span>
          </div>

          {/* Game cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.games.map((game) => (
              <GameCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
