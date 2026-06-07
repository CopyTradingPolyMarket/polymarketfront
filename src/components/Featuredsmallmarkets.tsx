"use client";

import SmallMarketCard from "./Marketcard";
import { MOCK_MARKETS } from "@/lib/markets"; // ← jedina promena

export default function MarketsList() {
  const handleSelect = (
    marketId: string,
    option: string,
    value: "yes" | "no"
  ) => {
    console.log({ marketId, option, value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MOCK_MARKETS.map((market) => (
        <SmallMarketCard
          key={market.id}
          market={market}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}