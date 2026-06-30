"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import GameCard from "./GameCard";
import type { Game } from "./GameCard";
import SportsSidebar from "./SportsSidebar";
import type { LeagueItem } from "./SportsSidebar";
import { useLivePrices } from "@/src/services/livePrices";

import { API_BASE, WS_BASE } from "@/src/config/api";

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

    groups.push({
      code,
      label: leagueLabel(code),
      games: list,
      hasLive: list.some((g) => g.live),
    });
  }

  groups.sort((a, b) => {
    if (a.hasLive !== b.hasLive) return a.hasLive ? -1 : 1;
    return b.games.length - a.games.length;
  });

  return groups;
}

function parseScore(raw: string | null): [string, string] {
  if (!raw) return ["–", "–"];
  const first = raw.split(",")[0].trim();
  const parts = first.split("-");
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join("-").trim()];
  return [raw, ""];
}

function abbrev(name: string): string {
  if (!name) return "SP";
  if (name.length <= 4) return name.toUpperCase();
  const words = name.split(/\s+/);
  if (words.length >= 2) return words.map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  return name.slice(0, 3).toUpperCase();
}

type Market = Game["markets"][number];

function getConditionId(source: unknown): string | undefined {
  const item = source as {
    conditionId?: string | number | null;
    condition_id?: string | number | null;
  } | null;
  const raw = item?.conditionId ?? item?.condition_id;

  return raw == null ? undefined : String(raw);
}

function getMainMarketConditionId(market: Market | undefined): string | undefined {
  return getConditionId(market) ?? getConditionId(market?.options?.[0]);
}

function toDisplayCents(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function FeaturedMarketPanel({ game }: { game: Game | null }) {
  const mainMarket = game?.markets.find((m) => m.options.length >= 2);
  const conditionId = getMainMarketConditionId(mainMarket);
  const livePrices = useLivePrices(conditionId ? [conditionId] : []);
  const livePrice = conditionId ? livePrices[conditionId] : undefined;

  if (!game) return null;

  const [homeScore, awayScore] = parseScore(game.score);
  const fallbackHomeProb = toDisplayCents(mainMarket?.options[0]?.probability, 50);
  const fallbackAwayProb = toDisplayCents(mainMarket?.options[1]?.probability, 100 - fallbackHomeProb);
  const homeProb = toDisplayCents(livePrice?.yes, fallbackHomeProb);
  const awayProb = toDisplayCents(livePrice?.no, fallbackAwayProb);
  const totalVol = game.markets.reduce((s, m) => s + (m.volume || 0), 0);

  return (
    <aside className="hidden xl:block w-[360px] shrink-0 sticky top-6 self-start">
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101114] shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-5">
            <button className="text-xs font-black uppercase tracking-[0.18em] text-white">
              Buy
            </button>
            <button className="text-xs font-black uppercase tracking-[0.18em] text-gray-600">
              Sell
            </button>
          </div>

          <button className="text-xs font-black uppercase tracking-[0.18em] text-gray-200">
            Dollars
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <div className="mb-2 text-sm font-semibold text-gray-400">
              {leagueLabel(game.league)}
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/25 bg-blue-500/15 text-xs font-black text-blue-200">
                {abbrev(game.league)}
              </div>

              <h3 className="text-[22px] font-black leading-[1.15] text-white">
                {game.homeTeam} vs {game.awayTeam}
              </h3>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-white/[0.06] p-1">
            <button className="rounded-full bg-blue-400 px-3 py-2 text-xs font-black text-black">
              YES {homeProb}¢
            </button>
            <button className="rounded-full px-3 py-2 text-xs font-black text-gray-300">
              NO {awayProb}¢
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3">
            <div className="text-sm font-semibold text-gray-500">Dollars</div>
            <div className="text-right text-2xl font-black text-gray-500">$0</div>
          </div>

          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400">Odds</span>
              <span className="text-sm font-bold text-white">{homeProb}% chance</span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-500">Max payout</div>
                <div className="text-xs font-semibold text-gray-600">
                  {totalVol > 0
                    ? `${new Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(totalVol)} vol`
                    : "No volume"}
                </div>
              </div>

              <div className="text-3xl font-black text-white">$0</div>
            </div>
          </div>

          <button className="w-full rounded-full bg-blue-400 px-4 py-3 text-sm font-black text-black transition hover:bg-blue-300">
            Sign up to trade
          </button>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-500">
              <span>{game.homeTeam}</span>
              <span>{homeScore}</span>
            </div>

            <div className="mb-3 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${homeProb}%` }} />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-500">
              <span>{game.awayTeam}</span>
              <span>{awayScore}</span>
            </div>

            <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${awayProb}%` }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
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
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Game[]) => {
        if (!cancelled) {
          setGames(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    function connect() {
      if (cancelled) return;

      const ws = new WebSocket(`${WS_BASE}/ws/sports`);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;

        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === "game_update") updateGame(msg);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;

        reconnectRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, 30000);
          connect();
        }, backoffRef.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [updateGame]);

  const allGroups = useMemo(() => buildGroups(games), [games]);

  const filteredGroups = useMemo(() => {
    if (!activeLeague) return allGroups;
    return allGroups.filter((g) => g.code === activeLeague);
  }, [allGroups, activeLeague]);

  const sidebarLeagues: LeagueItem[] = useMemo(
    () =>
      allGroups.map((g) => ({
        code: g.code,
        label: g.label,
        count: g.games.length,
        hasLive: g.hasLive,
      })),
    [allGroups]
  );

  const featuredGame = useMemo(() => {
    return filteredGroups[0]?.games.find((g) => g.markets.length > 0) ?? filteredGroups[0]?.games[0] ?? null;
  }, [filteredGroups]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-white/5 bg-[#111113] p-4">
            <div className="mb-3 h-3 w-1/4 rounded bg-white/[0.06]" />
            <div className="flex items-center gap-3">
              <div className="w-[200px] space-y-2">
                <div className="h-4 rounded bg-white/[0.06]" />
                <div className="h-4 rounded bg-white/[0.06]" />
              </div>
              <div className="flex flex-1 gap-2">
                <div className="h-12 flex-1 rounded bg-white/[0.06]" />
                <div className="h-12 flex-1 rounded bg-white/[0.06]" />
                <div className="h-12 flex-1 rounded bg-white/[0.06]" />
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
          <p className="text-sm text-gray-400">Couldn&apos;t load live games.</p>
          <p className="mt-1 text-xs text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (allGroups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <p className="text-sm text-gray-400">No live games right now.</p>
          <p className="mt-1 text-xs text-gray-600">Check back when matches are underway.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="hidden lg:block w-[180px] shrink-0 sticky top-4 self-start">
        <SportsSidebar
          leagues={sidebarLeagues}
          totalGames={games.length}
          activeLeague={activeLeague}
          onSelect={setActiveLeague}
        />
      </div>

      <div className="lg:hidden w-full">
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveLeague(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              !activeLeague ? "bg-blue-500/15 text-blue-300" : "bg-white/[0.04] text-gray-400"
            }`}
          >
            All
          </button>

          {sidebarLeagues.map((lg) => (
            <button
              key={lg.code}
              onClick={() => setActiveLeague(lg.code)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                activeLeague === lg.code ? "bg-blue-500/15 text-blue-300" : "bg-white/[0.04] text-gray-400"
              }`}
            >
              {lg.label} {lg.count}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.code}>
              <div className="mb-2 flex items-center gap-2 px-1">
                {group.hasLive && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                )}
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                  {group.label}
                </h3>
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

      <main className="hidden lg:block w-full max-w-[720px] min-w-0 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.code}>
            <div className="mb-2 flex items-center gap-4 px-1">
              <div className="flex shrink-0 items-center gap-2">
                {group.hasLive && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                )}

                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                  {group.label}
                </h3>

                <span className="text-[11px] text-gray-600">{group.games.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {group.games.map((game) => (
                <GameCard key={game.gameId} game={game} showColumns={true} />
              ))}
            </div>
          </div>
        ))}
      </main>

      <FeaturedMarketPanel game={featuredGame} />
    </div>
  );
}
