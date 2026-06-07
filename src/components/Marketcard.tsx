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
}

interface Props {
  market: Market;
  onSelect?: (marketId: string, option: string, value: "yes" | "no") => void;
}

export default function SmallMarketCard({ market, onSelect }: Props) {
  const router = useRouter();
  const slug = slugify(market.title);

  return (
    <div
      onClick={() => router.push(`/markets/${slug}`)}
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

      {/* OPTIONS */}
      <div className="flex flex-col gap-2">
        {market.options.map((opt, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-gray-400 min-w-[90px]">
              {opt.label}
            </span>

            <div className="flex items-center">

              <span className="text-[13px] font-semibold text-white w-[50px] text-right mr-4">
                {opt.probability}%
              </span>

              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelect?.(market.id, opt.label, "yes")}
                  className="px-2 py-1 text-[11px] rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  Yes
                </button>

                <button
                  onClick={() => onSelect?.(market.id, opt.label, "no")}
                  className="px-2 py-1 text-[11px] rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        ))}
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
