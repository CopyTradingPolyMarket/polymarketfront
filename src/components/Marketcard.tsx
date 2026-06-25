"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

export interface MarketOption {
  label: string;
  probability: number; // 0–100
  multiplier?: number; // payout shown as "x" — falls back to an implied value if API doesn't send one yet
  image?: string;      // optional small icon/logo for this option (e.g. team logo)
  color?: string;      // optional accent color for this option's underline — falls back to a stable per-index color
}

export interface Market {
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
}

interface Props {
  market: Market;
  onSelect?: (marketId: string, optionLabel: string) => void;
}

// Accent color per option, by position. Stable + readable; first is green to
// match the reference. Override per-option via MarketOption.color.
const PALETTE = ["#34d399", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6", "#eab308", "#ec4899"];

// Rough implied payout multiplier if the API doesn't send one directly.
function impliedMultiplier(probability: number): number {
  if (probability <= 0) return 0;
  return Math.round((100 / probability) * 100) / 100;
}

function OptionRow({ option, index, onClick }: { option: MarketOption; index: number; onClick: () => void }) {
  const color = option.color ?? PALETTE[index % PALETTE.length];
  const multiplier = option.multiplier ?? impliedMultiplier(option.probability);
  const pct = Math.round(option.probability);

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
            className="h-[2.5px] rounded-full mt-1.5"
            style={{ width: `${Math.max(pct, 5)}%`, minWidth: 14, background: color }}
          />
        </div>
      </div>

      {/* multiplier + percent pill */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-[11px] text-gray-500 tabular-nums text-right min-w-[40px]">
          {multiplier.toFixed(2)}x
        </span>
        <span className="text-[11px] font-bold text-white border border-emerald-500/50 rounded-full px-3 py-1 tabular-nums text-center min-w-[56px]">
          {pct}%
        </span>
      </div>
    </div>
  );
}

export default function SmallMarketCard({ market, onSelect }: Props) {
  const router = useRouter();
  const slug = market.slug ?? slugify(market.title);
  const displayOptions = market.options.slice(0, 2);
  const optionsCount = market.optionsCount ?? market.options.length;

  return (
    <div
      onClick={() => router.push(`/markets/${slug}`)}
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
      <div className="flex flex-col gap-1">
        {displayOptions.map((opt, i) => (
          <OptionRow key={opt.label} option={opt} index={i} onClick={() => onSelect?.(market.id, opt.label)} />
        ))}
      </div>

      {/* FOOTER — no divider, just spacing */}
      <div className="flex items-center justify-between mt-3.5 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          {market.closesInLabel ? (
            <span className="text-orange-400 font-medium tabular-nums">{market.closesInLabel}</span>
          ) : null}
          <span>{market.volume}</span>
        </div>
        {optionsCount > displayOptions.length ? <span>{optionsCount} markets</span> : null}
      </div>
    </div>
  );
}
