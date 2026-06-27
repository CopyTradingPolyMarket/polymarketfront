"use client";

import { useState, useEffect } from "react";
import { API_BASE, WS_BASE } from "@/src/config/api";
import { SPOT_WINDOW_MS } from "@/app/markets/[slug]/_lib/constants";

export function useSpotChart(spotSymbol: string | undefined) {
  const [spotData,    setSpotData]    = useState<{ date: string; value: number }[]>([]);
  const [spotLoading, setSpotLoading] = useState(false);

  useEffect(() => {
    if (!spotSymbol) return;
    setSpotLoading(true);
    const encoded = encodeURIComponent(spotSymbol);
    fetch(`${API_BASE}/api/spot/${encoded}/history`)
      .then((r) => r.ok ? r.json() : { points: [] })
      .then((data: { points: { t: number; value: number }[] }) => {
        const now = Date.now();
        setSpotData(
          (data.points ?? [])
            .filter((pt) => pt.t >= now - SPOT_WINDOW_MS)
            .map((pt) => ({
              date: new Date(pt.t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
              value: pt.value,
            }))
        );
      })
      .catch(() => setSpotData([]))
      .finally(() => setSpotLoading(false));
  }, [spotSymbol]);

  useEffect(() => {
    if (!spotSymbol) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1000;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(`${WS_BASE}/ws/spot`);

      ws.onopen = () => { backoff = 1000; };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === 'spot_update' && msg.symbol === spotSymbol) {
            const t = msg.priceTs ? Date.parse(msg.priceTs) : Date.now();
            const date = new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            setSpotData((prev) => {
              const cutoff = Date.now() - SPOT_WINDOW_MS;
              const filtered = prev.filter((_, i) => {
                const ptDate = prev[i];
                return ptDate !== undefined;
              });
              const next = [...filtered, { date, value: msg.value as number }];
              if (next.length > 200) next.splice(0, next.length - 200);
              return next;
            });
          }
        } catch {}
      };

      ws.onclose = () => {
        if (cancelled) return;
        backoff = Math.min(backoff * 2, 30_000);
        reconnectTimer = setTimeout(connect, backoff);
      };

      ws.onerror = () => { ws?.close(); };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [spotSymbol]);

  return { spotData, spotLoading };
}
