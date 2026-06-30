"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatVolume } from "@/src/utils/formatters";
import { useLivePrices } from "@/src/services/livePrices";

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

const WINNER_TYPES = ["moneyline", "baseball_team_first_five_winner", "child_moneyline"];
const WINNER_PATTERN = /winner|moneyline|h2h/i;

export function getMoneylines(game: Game): GameMarket[] {
  for (const t of WINNER_TYPES) {
    const group = game.markets.filter((m) => m.sportsMarketType === t);
    if (group.length > 0) return group;
  }

  const byType = new Map<string, GameMarket[]>();

  for (const m of game.markets) {
    const t = m.sportsMarketType;
    if (t && WINNER_PATTERN.test(t)) {
      const arr = byType.get(t) ?? [];
      arr.push(m);
      byType.set(t, arr);
    }
  }

  for (const [, group] of byType) {
    if (group.length >= 2 && group.length <= 3) return group;
  }

  const fallback = game.markets.filter((m) => m.options.length >= 2);

  if (fallback.length > 0) {
    fallback.sort((a, b) => b.volume - a.volume);
    return [fallback[0]];
  }

  return [];
}

function extractMlLabel(title: string): string {
  if (/\bdraw\b|\btie\b|\btied\b/i.test(title)) return "Draw";
  const m = title.match(/^Will (.+?) (?:win|be winning)\b/i);
  if (m) return m[1];
  return title.split(":")[0].trim();
}

const SPREAD_PATTERN = /spread|handicap/i;
const TOTAL_PATTERN = /total|over_under|over|under/i;

function pickSpread(markets: GameMarket[], used: Set<string>): GameMarket | null {
  const pool = markets.filter((m) => m.line !== null && !used.has(m.id));
  const exact = pool.filter((m) => m.sportsMarketType === "spreads");

  if (exact.length > 0) {
    exact.sort((a, b) => Math.abs(a.line!) - Math.abs(b.line!));
    return exact[0];
  }

  const fuzzy = pool.filter((m) => m.sportsMarketType && SPREAD_PATTERN.test(m.sportsMarketType));

  if (fuzzy.length > 0) {
    fuzzy.sort((a, b) => Math.abs(a.line!) - Math.abs(b.line!));
    return fuzzy[0];
  }

  return null;
}

function pickTotal(markets: GameMarket[], used: Set<string>): GameMarket | null {
  const pool = markets.filter((m) => m.line !== null && !used.has(m.id));
  const exact = pool.filter((m) => m.sportsMarketType === "totals");

  if (exact.length > 0) {
    exact.sort((a, b) => b.volume - a.volume);
    return exact[0];
  }

  const fuzzy = pool.filter((m) => m.sportsMarketType && TOTAL_PATTERN.test(m.sportsMarketType));

  if (fuzzy.length > 0) {
    fuzzy.sort((a, b) => b.volume - a.volume);
    return fuzzy[0];
  }

  return null;
}

export function allocateColumns(game: Game): {
  moneyline: GameMarket[];
  spread: GameMarket | null;
  total: GameMarket | null;
} {
  const used = new Set<string>();
  const moneyline = getMoneylines(game);

  for (const m of moneyline) used.add(m.id);

  const spread = pickSpread(game.markets, used);
  if (spread) used.add(spread.id);

  const total = pickTotal(game.markets, used);

  return { moneyline, spread, total };
}

export function getSpread(game: Game): GameMarket | null {
  return pickSpread(game.markets, new Set());
}

export function getTotal(game: Game): GameMarket | null {
  return pickTotal(game.markets, new Set());
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function PriceBtn({ label, cents, lead }: { label: string; cents: number; lead: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 text-center transition-all ${
        lead
          ? "border-blue-400/45 bg-blue-500/12 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.08)]"
          : "border-white/[0.07] bg-white/[0.035] text-gray-300"
      }`}
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-bold tabular-nums">
        {cents.toFixed(1)}¢
      </div>
    </div>
  );
}

function EmptyCol() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-1.5 text-center text-xs text-gray-600">
        —
      </div>
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-1.5 text-center text-xs text-gray-600">
        —
      </div>
    </div>
  );
}

function TeamBadge({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-xs font-black text-blue-200">
      {abbrev(name)}
    </div>
  );
}

function TeamRow({
  name,
  score,
  probability,
  active,
}: {
  name: string;
  score: string;
  probability: number;
  active: boolean;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr_auto_auto] items-center gap-2">
      <TeamBadge name={name} />

      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold text-gray-100">
          {name}
        </div>

        <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${active ? "bg-blue-400" : "bg-blue-500/55"}`}
            style={{ width: `${Math.max(5, Math.min(100, probability))}%` }}
          />
        </div>
      </div>

      <div className="w-7 text-right text-[13px] font-bold tabular-nums text-gray-200">
        {score}
      </div>

      <div
        className={`min-w-[62px] rounded-full border px-3 py-1.5 text-center text-[15px] font-black tabular-nums ${
          active
            ? "border-blue-400/70 bg-blue-500/10 text-blue-300"
            : "border-blue-400/25 bg-white/[0.025] text-gray-300"
        }`}
      >
        {Math.round(probability)}%
      </div>
    </div>
  );
}

function MoneylineCol({
  markets,
  homeTeam,
  awayTeam,
}: {
  markets: GameMarket[];
  homeTeam: string;
  awayTeam: string;
}) {
  if (markets.length === 0) return <EmptyCol />;

  if (markets.length >= 3) {
    type Outcome = { label: string; cents: number; order: number };

    const outcomes: Outcome[] = markets
      .map((m) => {
        const raw = extractMlLabel(m.title);
        const isDraw = /\bdraw\b|\btie\b|\btied\b/i.test(m.title);
        const label = isDraw ? "Draw" : abbrev(raw);
        const cents = round1(m.options[0]?.probability ?? 0);
        const order = isDraw ? 1 : m.title.toLowerCase().includes(homeTeam.toLowerCase()) ? 0 : 2;

        return { label, cents, order };
      })
      .filter((o) => o.cents > 0);

    if (outcomes.length === 0) return <EmptyCol />;

    outcomes.sort((a, b) => a.order - b.order);

    const maxCents = Math.max(...outcomes.map((o) => o.cents));

    return (
      <div className="grid grid-cols-3 gap-2">
        {outcomes.map((o, i) => (
          <PriceBtn
            key={i}
            label={o.label}
            cents={o.cents}
            lead={o.cents === maxCents && maxCents > 0}
          />
        ))}
      </div>
    );
  }

  const m = markets[0];
  const p0 = round1(m.options[0]?.probability ?? 0);
  const p1 = round1(m.options[1]?.probability ?? 0);

  return (
    <div className="grid grid-cols-2 gap-2">
      <PriceBtn label={abbrev(homeTeam)} cents={p0} lead={p0 > p1} />
      <PriceBtn label={abbrev(awayTeam)} cents={p1} lead={p1 > p0} />
    </div>
  );
}

function SpreadTotalCol({
  market,
  type,
}: {
  market: GameMarket | null;
  homeTeam: string;
  awayTeam: string;
  type: "sp" | "tot";
}) {
  if (!market || market.options.length < 2) return <EmptyCol />;

  const o = market.options;
  const p0 = round1(o[0].probability);
  const p1 = round1(o[1].probability);

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
    <div className="grid grid-cols-2 gap-2">
      <PriceBtn label={label0} cents={p0} lead={p0 > p1} />
      <PriceBtn label={label1} cents={p1} lead={p1 > p0} />
    </div>
  );
}

export default function GameCard({ game, showColumns }: { game: Game; showColumns: boolean }) {
  const router = useRouter();
  const [homeScore, awayScore] = parseScore(game.score);
  const label = statusLabel(game);

  const { moneyline: rawMls, spread: rawSp, total: rawTot } = useMemo(
    () => allocateColumns(game),
    [game]
  );

  const displayedIds = useMemo(() => {
    const ids: string[] = rawMls.map((m) => m.id);
    if (rawSp) ids.push(rawSp.id);
    if (rawTot) ids.push(rawTot.id);
    return ids;
  }, [rawMls, rawSp, rawTot]);

  const live = useLivePrices(displayedIds);

  const applyLive = (m: GameMarket): GameMarket => {
    const lp = live[m.id];

    if (!lp || (lp.yes <= 0 && lp.no <= 0)) return m;

    return {
      ...m,
      options: m.options.map((o, i) => ({
        ...o,
        probability: i === 0 ? lp.yes : lp.no,
      })),
    };
  };

  const mls = rawMls.map(applyLive);
  const sp = rawSp ? applyLive(rawSp) : null;
  const tot = rawTot ? applyLive(rawTot) : null;

  const totalVol = game.markets.reduce((s, m) => s + (m.volume || 0), 0);

  const mainMl = mls[0];
  const homeProb = Math.round(mainMl?.options[0]?.probability ?? 50);
  const awayProb = Math.round(mainMl?.options[1]?.probability ?? 50);

  const handleClick = () => {
    router.push(`/sports/${game.gameId}`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className="
        group relative overflow-hidden rounded-xl
        border border-white/[0.07]
        bg-[#101114]
        px-4 py-3
        cursor-pointer
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:border-blue-400/30
        hover:bg-[#12151b]
        hover:shadow-[0_12px_36px_rgba(0,0,0,0.22)]
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-28 w-28 rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-400/25 bg-blue-500/15 text-[10px] font-black text-blue-200">
                {abbrev(game.league || "SP")}
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                {game.league || "Sports"}
              </div>
            </div>

            <h3 className="text-[16px] font-bold leading-tight text-white">
              {game.homeTeam} vs {game.awayTeam}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
              {game.live && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.75)]" />
              )}

              <span className={game.live ? "text-red-400" : "text-gray-500"}>
                {label || (game.ended ? "Ended" : "Upcoming")}
              </span>
            </div>
          </div>

          <div className="text-right text-xs font-semibold text-gray-500">
            {game.markets.length} markets
          </div>
        </div>

        <div className="space-y-2.5">
          <TeamRow
            name={game.homeTeam}
            score={homeScore}
            probability={homeProb}
            active={homeProb >= awayProb}
          />

          <TeamRow
            name={game.awayTeam}
            score={awayScore}
            probability={awayProb}
            active={awayProb > homeProb}
          />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div className="text-xs font-bold text-gray-300">
            {totalVol > 0 ? `${formatVolume(totalVol, { thousandDigits: 1 })} vol` : "No volume"}
          </div>

          <div className="text-xs font-semibold text-gray-500">
            {game.markets.length} markets
          </div>
        </div>

        {/* {showColumns && (
          <div className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 lg:grid-cols-3">
            <div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                Moneyline
              </div>
              <MoneylineCol markets={mls} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
            </div>

            <div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                Spread
              </div>
              <SpreadTotalCol market={sp} homeTeam={game.homeTeam} awayTeam={game.awayTeam} type="sp" />
            </div>

            <div>
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                Total
              </div>
              <SpreadTotalCol market={tot} homeTeam={game.homeTeam} awayTeam={game.awayTeam} type="tot" />
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}