"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { useLivePrices } from "@/src/services/livePrices";

export interface MarketOption {
  label: string;
  probability: number; // 0–100
  multiplier?: number; // payout shown as "x" — falls back to an implied value if API doesn't send one yet
  image?: string;      // optional small icon/logo for this option (e.g. team logo)
  color?: string;      // optional accent color for this option's underline — falls back to a stable per-index color
  conditionId?: string;          // sub-market conditionId → live subscription key on /ws/prices
  priceSide?: "yes" | "no";      // which side of the conditionId's price_update this option reflects (default "yes")
}

export interface Market {
  type?: "market" | "event" | "game";
  id: string;
  title: string;
  image: string;
  volume: string;
  options: MarketOption[];   // only the first 2 are rendered on the card
  optionsCount?: number;     // total number of outcomes this market has (shown as "N markets"); defaults to options.length
  categoryLabel?: string;    // small caps label next to the icon, e.g. "CONGRESS" or "BTC"
  closesInLabel?: string;    // optional countdown shown in orange next to volume, e.g. "21:23"
  slug?: string;
  eventId?: string;
  eventMarketCount?: number;
  eventSlug?: string;
  gameId?: number | null;
}

interface Props {
  market: Market;
  onSelect?: (marketId: string, optionLabel: string) => void;
}

// Accent color per option, by position. Stable + readable; first is green to
// match the reference. Override per-option via MarketOption.color.
const PALETTE = ["#60a5fa", "#2563eb", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6", "#eab308", "#ec4899"];

// Rough implied payout multiplier if the API doesn't send one directly.
function impliedMultiplier(probability: number): number {
  if (probability <= 0) return 0;
  return Math.round((100 / probability) * 100) / 100;
}

function OptionRow({ option, index, onClick }: { option: MarketOption; index: number; onClick: () => void }) {
  const color = option.color ?? PALETTE[index % PALETTE.length];
  const multiplier = option.multiplier ?? impliedMultiplier(option.probability);
  const pct1 = Math.round(option.probability * 10) / 10;
  const pctDisplay = pct1.toFixed(1);

  // Detect live changes → subtle glow on the pill + a light sweep on the bar.
  const prevPct = useRef(pct1);
  const sweepRef = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prevPct.current === pct1) return;
    setDir(pct1 > prevPct.current ? "up" : "down");
    prevPct.current = pct1;

    // sweep a soft light across the bar
    const el = sweepRef.current;
    if (el && typeof el.animate === "function") {
      el.animate(
        [
          { transform: "translateX(-130%)", opacity: 0 },
          { transform: "translateX(-15%)", opacity: 1, offset: 0.5 },
          { transform: "translateX(160%)", opacity: 0 },
        ],
        { duration: 750, easing: "ease-out" }
      );
    }

    const t = setTimeout(() => setDir(null), 600);
    return () => clearTimeout(t);
  }, [pct1]);

  const flashGlow =
    dir === "up"
      ? "0 0 10px rgba(96,165,250,0.3)"
      : dir === "down"
      ? "0 0 10px rgba(248,113,113,0.3)"
      : "none";
  const flashBorder =
    dir === "up" ? "rgba(96,165,250,0.55)" : dir === "down" ? "rgba(248,113,113,0.55)" : undefined;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-between gap-3 -mx-1.5 px-1.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.03] transition"
    >
      {/* label + accent underline (width tracks probability) */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {option.image ? (
          <img src={option.image} alt="" className="w-4 h-4 rounded object-contain shrink-0" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-white leading-none truncate">{option.label}</p>
          <div
            className="relative h-[2.5px] rounded-full mt-1.5 overflow-hidden transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(pct1, 5)}%`, minWidth: 14 }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: color }} />
            {/* light sweep overlay */}
            <div
              ref={sweepRef}
              className="absolute inset-y-0 left-0 w-1/2 rounded-full pointer-events-none"
              style={{
                opacity: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
              }}
            />
          </div>
        </div>
      </div>

      {/* multiplier + percent pill */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-[11px] text-gray-500 tabular-nums text-right min-w-[40px]">
          {multiplier.toFixed(2)}x
        </span>
        <span
          className="text-[11px] font-bold text-white border border-blue-500/50 rounded-full px-3 py-1 tabular-nums text-center min-w-[60px] transition-[box-shadow,border-color] duration-500 ease-out"
          style={{ borderColor: flashBorder, boxShadow: flashGlow }}
        >
          {pctDisplay}%
        </span>
      </div>
    </div>
  );
}

export default function SmallMarketCard({ market, onSelect }: Props) {
  const router = useRouter();
  const slug = market.slug ?? slugify(market.title);
  const isEvent = market.type === "event";
  const isGame  = market.type === "game";
  const isGrouped = isEvent || isGame;
  const displayOptions = market.options.slice(0, 2);
  const optionsCount = market.optionsCount ?? market.options.length;

  // Per-option conditionId (multi-outcome) or card's own id (binary solo).
  const optionCids = displayOptions.map((o) => o.conditionId).filter(Boolean) as string[];
  const subIds = optionCids.length > 0 ? optionCids : (isGrouped ? [] : [market.id]);
  const live = useLivePrices(subIds);
  const liveOptions = displayOptions.map((o, i) => {
    if (o.conditionId) {
      const p = live[o.conditionId];
      if (!p) return o;
      const probability = o.priceSide === "no" ? p.no : p.yes;
      return { ...o, probability, multiplier: undefined };
    }
    const lp = live[market.id];
    if (!lp) return o;
    const probability = i === 0 ? lp.yes : lp.no;
    return { ...o, probability, multiplier: undefined };
  });

  return (
    <div
      onClick={() => {
        if (isGame && market.gameId) {
          router.push(`/sports/${market.gameId}`);
        } else if (isGrouped && market.eventSlug) {
          router.push(`/events/${market.eventSlug}`);
        } else {
          router.push(`/markets/${slug}`);
        }
      }}
      className="cursor-pointer w-full rounded-xl border border-white/[0.06] bg-[#131316] p-3.5 hover:border-white/10 transition"
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3">
        {market.image ? (
          <img src={market.image} alt={market.title} className="w-6 h-6 rounded-md object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-white/10 shrink-0" />
        )}
        {market.categoryLabel ? (
          <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase truncate">
            {market.categoryLabel}
          </span>
        ) : null}
      </div>

      {/* TITLE */}
      <h3 className="text-[13px] font-bold text-white leading-snug mb-3.5">{market.title}</h3>

      {/* OPTIONS */}
      {isGrouped ? (
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-gray-400 border border-white/[0.08]">
            {market.eventMarketCount ?? 0} {isGame ? "markets" : "outcomes"}
          </span>
          <span className="text-[11px] text-gray-600">{isGame ? "View game" : "View all"}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {liveOptions.map((opt, i) => (
            <OptionRow key={opt.label} option={opt} index={i} onClick={() => onSelect?.(market.id, opt.label)} />
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-3.5 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          {market.closesInLabel ? (
            <span className="text-orange-400 font-medium tabular-nums">{market.closesInLabel}</span>
          ) : null}
          <span>{market.volume}</span>
        </div>
        {!isGrouped && optionsCount > displayOptions.length ? <span>{optionsCount} markets</span> : null}
      </div>
    </div>
  );
}