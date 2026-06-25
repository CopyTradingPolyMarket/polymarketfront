"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";

export interface MarketOption {
  label: string;
  probability: number;
}

export interface Market {
  id: string;
  title: string;
  image: string;
  volume: string;
  options: MarketOption[];
  slug?: string;
  eventId?: string;
  eventMarketCount?: number;
  eventSlug?: string;
}

interface Props {
  market: Market;
  onSelect?: (marketId: string, option: string, value: "yes" | "no") => void;
}

export default function SmallMarketCard({ market, onSelect }: Props) {
  const router = useRouter();
  const slug = market.slug ?? slugify(market.title);

  const yesOpt = market.options.find((o) => o.label.toLowerCase() === "yes") ?? market.options[0];
  const noOpt  = market.options.find((o) => o.label.toLowerCase() === "no")  ?? market.options[1];

  return (
    <div
      onClick={() => {
        const isMulti = (market.eventMarketCount ?? 0) >= 2 && market.eventSlug;
        router.push(isMulti ? `/events/${market.eventSlug}` : `/markets/${slug}`);
      }}
      className="cursor-pointer w-full rounded-2xl border border-white/5 bg-[#111113] p-4 flex flex-col gap-4 hover:border-white/10 transition"
    >
      {/* HEADER */}
      <div className="flex gap-3">
        <img
          src={market.image}
          alt={market.title}
          className="w-10 h-10 rounded-lg object-cover"
        />

        <h3 className="text-[13.5px] font-semibold text-white leading-snug">
          {market.title}
        </h3>
      </div>

      {/* OPTIONS — single Yes/No row */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[20px] font-bold text-white leading-none">
            {yesOpt?.probability ?? 0}%
          </span>
          <span className="text-[11px] text-gray-500">Yes</span>
        </div>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSelect?.(market.id, yesOpt?.label ?? "Yes", "yes")}
            className="px-2 py-1 text-[11px] rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            Yes
          </button>
          {noOpt && (
            <button
              onClick={() => onSelect?.(market.id, noOpt.label, "no")}
              className="px-2 py-1 text-[11px] rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              No
            </button>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[12px] text-gray-500">{market.volume}</span>

        <div className="flex gap-2 text-gray-500">
          <button className="hover:text-white transition">🎁</button>
          <button className="hover:text-white transition">🔖</button>
        </div>
      </div>
    </div>
  );
}
