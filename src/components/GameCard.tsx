"use client";

import { useRouter } from "next/navigation";

export interface MarketOption {
  label: string;
  probability: number;
}

export interface GameMarket {
  id: string;
  title: string;
  slug: string | null;
  volume: number;
  options: MarketOption[];
  sportsMarketType: string | null;
  line: number | null;
}

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
  markets: GameMarket[];
}

function parseScore(raw: string | null): [string, string] {
  if (!raw) return ["–", "–"];
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

function abbrev(name: string): string {
  if (name.length <= 4) return name.toUpperCase();
  const words = name.split(/\s+/);
  if (words.length >= 2) return words.map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  return name.slice(0, 3).toUpperCase();
}

function formatVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export function getMoneylines(game: Game): GameMarket[] {
  return game.markets.filter((m) => m.sportsMarketType === "moneyline");
}

function extractMlLabel(title: string): string {
  if (/\bdraw\b|\btie\b/i.test(title)) return "Draw";
  const m = title.match(/^Will (.+?) win\b/i);
  if (m) return m[1];
  return title.split(":")[0].trim();
}

export function getSpread(game: Game): GameMarket | null {
  const spreads = game.markets.filter((m) => m.sportsMarketType === "spreads" && m.line !== null);
  if (spreads.length === 0) return null;
  spreads.sort((a, b) => Math.abs(a.line!) - Math.abs(b.line!));
  return spreads[0];
}

export function getTotal(game: Game): GameMarket | null {
  const totals = game.markets.filter((m) => m.sportsMarketType === "totals" && m.line !== null);
  if (totals.length === 0) return null;
  totals.sort((a, b) => b.volume - a.volume);
  return totals[0];
}

function PriceBtn({ label, cents, lead }: { label: string; cents: number; lead: boolean }) {
  return (
    <div
      className={`flex-1 rounded-lg px-1.5 py-1.5 text-center text-[11px] font-semibold tabular-nums leading-tight transition-colors ${
        lead
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"
      }`}
    >
      <div className="truncate">{label}</div>
      <div className={`text-[12px] font-bold ${lead ? "text-emerald-300" : "text-gray-300"}`}>{cents}¢</div>
    </div>
  );
}

function EmptyCol() {
  return (
    <div className="flex gap-1 flex-1">
      <div className="flex-1 rounded-lg px-1.5 py-1.5 text-center text-[11px] text-gray-600 bg-white/[0.02] border border-white/[0.04]">—</div>
      <div className="flex-1 rounded-lg px-1.5 py-1.5 text-center text-[11px] text-gray-600 bg-white/[0.02] border border-white/[0.04]">—</div>
    </div>
  );
}

function MoneylineCol({ markets, homeTeam, awayTeam }: { markets: GameMarket[]; homeTeam: string; awayTeam: string }) {
  if (markets.length === 0) return <EmptyCol />;

  // 3-way: each market is a binary "Will X win?" / "end in draw?" — use Yes price per market
  if (markets.length >= 3) {
    type Outcome = { label: string; cents: number; order: number };
    const outcomes: Outcome[] = markets.map((m) => {
      const raw = extractMlLabel(m.title);
      const isDraw = /\bdraw\b|\btie\b/i.test(m.title);
      const label = isDraw ? "Draw" : abbrev(raw);
      const cents = Math.round(m.options[0]?.probability ?? 0);
      const order = isDraw ? 1 : m.title.toLowerCase().includes(homeTeam.toLowerCase()) ? 0 : 2;
      return { label, cents, order };
    });
    outcomes.sort((a, b) => a.order - b.order);
    const maxCents = Math.max(...outcomes.map((o) => o.cents));
    return (
      <div className="flex gap-1 flex-1">
        {outcomes.map((o, i) => (
          <PriceBtn key={i} label={o.label} cents={o.cents} lead={o.cents === maxCents && maxCents > 0} />
        ))}
      </div>
    );
  }

  // 2-way: single binary market — options[0]=Yes (home), options[1]=No (away)
  const m = markets[0];
  const p0 = Math.round(m.options[0]?.probability ?? 0);
  const p1 = Math.round(m.options[1]?.probability ?? 0);
  return (
    <div className="flex gap-1 flex-1">
      <PriceBtn label={abbrev(homeTeam)} cents={p0} lead={p0 > p1} />
      <PriceBtn label={abbrev(awayTeam)} cents={p1} lead={p1 > p0} />
    </div>
  );
}

function SpreadTotalCol({ market, homeTeam, awayTeam, type }: { market: GameMarket | null; homeTeam: string; awayTeam: string; type: "sp" | "tot" }) {
  if (!market || market.options.length < 2) return <EmptyCol />;

  const o = market.options;
  const p0 = Math.round(o[0].probability);
  const p1 = Math.round(o[1].probability);

  let label0: string;
  let label1: string;

  if (type === "sp") {
    const line = market.line ?? 0;
    label0 = `${abbrev(o[0].label)} ${line > 0 ? "+" : ""}${line}`;
    label1 = `${abbrev(o[1].label)} ${line > 0 ? "-" : "+"}${Math.abs(line)}`;
  } else {
    const line = market.line ?? 0;
    label0 = `O ${line}`;
    label1 = `U ${line}`;
  }

  return (
    <div className="flex gap-1 flex-1">
      <PriceBtn label={label0} cents={p0} lead={p0 > p1} />
      <PriceBtn label={label1} cents={p1} lead={p1 > p0} />
    </div>
  );
}

export default function GameCard({ game, showColumns }: { game: Game; showColumns: boolean }) {
  const router = useRouter();
  const [homeScore, awayScore] = parseScore(game.score);
  const label = statusLabel(game);
  const firstSlug = game.markets.find((m) => m.slug)?.slug;

  const mls = getMoneylines(game);
  const sp = getSpread(game);
  const tot = getTotal(game);
  const totalVol = game.markets.reduce((s, m) => s + (m.volume || 0), 0);

  const handleClick = () => {
    router.push(`/sports/${game.gameId}`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className="rounded-xl border border-white/[0.06] bg-[#111113] px-4 py-3 transition-all duration-150 cursor-pointer hover:border-white/[0.12] hover:bg-[#151518]"
    >
      <div className="flex items-center gap-4">
        {/* Left: teams + score */}
        <div className="w-[200px] shrink-0">
          {/* Status pill */}
          <div className="flex items-center gap-1.5 mb-2">
            {game.live && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${game.live ? "text-red-400" : "text-gray-600"}`}>
              {label}
            </span>
            {totalVol > 0 && <span className="text-[10px] text-gray-600 ml-auto">{formatVol(totalVol)} Vol</span>}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[15px] font-bold text-white tabular-nums w-6 text-right">{homeScore}</span>
            <span className="text-[13px] font-medium text-gray-200 truncate">{game.homeTeam}</span>
          </div>
          {/* Away team */}
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-white tabular-nums w-6 text-right">{awayScore}</span>
            <span className="text-[13px] font-medium text-gray-200 truncate">{game.awayTeam}</span>
          </div>
        </div>

        {/* Right: 3 market columns */}
        {showColumns && (
          <div className="flex-1 flex gap-2 min-w-0">
            <MoneylineCol markets={mls} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
            <SpreadTotalCol market={sp} homeTeam={game.homeTeam} awayTeam={game.awayTeam} type="sp" />
            <SpreadTotalCol market={tot} homeTeam={game.homeTeam} awayTeam={game.awayTeam} type="tot" />
          </div>
        )}
      </div>
    </div>
  );
}
