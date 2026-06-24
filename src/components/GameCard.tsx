"use client";

import { useRouter } from "next/navigation";

export interface Game {
  gameId: number | string;
  league: string;
  slug: string | null;
  homeTeam: string;
  awayTeam: string;
  status: string | null;
  score: string | null;
  period: string | null;
  elapsed: string | null;
  turn: string | null;
  live: boolean;
  ended: boolean;
  markets: Array<{ slug?: string }>;
}

function parseScore(raw: string | null): [string, string] {
  if (!raw) return ["–", "–"];
  // Handle formats like "2-0", "112-108", "6-7(6-8), 2-3"
  const first = raw.split(",")[0].trim();
  const parts = first.split("-");
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join("-").trim()];
  return [raw, ""];
}

function statusLabel(g: Game): string {
  const parts: string[] = [];
  if (g.period) parts.push(g.period);
  if (g.elapsed) parts.push(g.elapsed.includes("'") ? g.elapsed : `${g.elapsed}'`);
  if (parts.length > 0) return parts.join(" ");
  if (g.status && g.status.toLowerCase() !== "inprogress") return g.status;
  return g.live ? "Live" : g.ended ? "Ended" : "";
}

export default function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const [homeScore, awayScore] = parseScore(game.score);
  const label = statusLabel(game);
  const hasMarket = game.markets?.length > 0 && game.markets[0]?.slug;

  const handleClick = () => {
    if (hasMarket) router.push(`/markets/${game.markets[0].slug}`);
  };

  return (
    <div
      onClick={handleClick}
      role={hasMarket ? "button" : undefined}
      tabIndex={hasMarket ? 0 : undefined}
      className={`rounded-2xl border border-white/[0.06] bg-[#111113] p-4 transition-all duration-150 ${
        hasMarket ? "cursor-pointer hover:border-white/[0.12] hover:bg-[#151518] active:scale-[0.99]" : ""
      }`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {game.live && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${game.live ? "text-red-400" : "text-gray-500"}`}>
            {label}
          </span>
        </div>
        {!hasMarket && (
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">No markets</span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[14px] font-semibold text-gray-200 truncate">{game.homeTeam}</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-[22px] font-extrabold text-white tabular-nums leading-none">{homeScore}</span>
          <span className="text-[14px] text-gray-600 font-medium">–</span>
          <span className="text-[22px] font-extrabold text-white tabular-nums leading-none">{awayScore}</span>
        </div>

        {/* Away */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-gray-200 truncate">{game.awayTeam}</p>
        </div>
      </div>
    </div>
  );
}
