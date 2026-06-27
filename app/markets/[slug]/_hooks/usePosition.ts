"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/src/config/api";
import type { MappedMarket } from "@/app/markets/[slug]/_lib/types";

export function usePosition(
  market: MappedMarket | null,
  authenticated: boolean,
  getAccessToken: () => Promise<string | null>,
  panelMode: "buy" | "sell",
) {
  const [userPosition,   setUserPosition]   = useState<{ yesShares: number; noShares: number; yesSharesMicro: number; noSharesMicro: number } | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);

  const refetchPosition = useCallback(async () => {
    if (!authenticated || !market) return;
    setPositionLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const positions: { conditionId: string; yesShares: number; noShares: number }[] = await res.json();
      const pos = positions.find((p) => p.conditionId === market.id) ?? null;
      setUserPosition(pos ? {
        yesShares:     pos.yesShares,
        noShares:      pos.noShares,
        yesSharesMicro: Math.round(pos.yesShares * 1_000_000),
        noSharesMicro:  Math.round(pos.noShares  * 1_000_000),
      } : null);
    } catch {} finally {
      setPositionLoading(false);
    }
  }, [authenticated, market, getAccessToken]);

  useEffect(() => { refetchPosition(); }, [refetchPosition]);

  // Refresh positions when entering sell mode so holdings are always current
  useEffect(() => {
    if (panelMode === "sell") refetchPosition();
  }, [panelMode, refetchPosition]);

  return { userPosition, positionLoading, refetchPosition };
}
