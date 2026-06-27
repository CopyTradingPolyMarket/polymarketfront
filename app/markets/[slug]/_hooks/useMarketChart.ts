"use client";

import { useState, useEffect, useRef } from "react";
import type { OhlcPoint } from "@/src/components/CandlestickChart";
import { API_BASE, WS_BASE } from "@/src/config/api";
import { formatRangeDate } from "@/src/utils/dateFormatters";
import { RANGE_MAP, RANGE_BUCKET } from "@/app/markets/[slug]/_lib/constants";
import { isConditionId } from "@/app/markets/[slug]/_lib/helpers";
import type { ApiChartPoint, ChartShape, Range, MappedMarket } from "@/app/markets/[slug]/_lib/types";

// Chart history fetch AND the /ws/prices socket live together here because they
// share chartData/ohlcData: the socket's 'history_point' messages append/replace
// into the same series the history fetch populates. rangeRef lets the socket read
// the latest range without resubscribing.
export function useMarketChart(market: MappedMarket | null, slug: string, range: Range) {
  const [chartData,    setChartData]    = useState<{ date: string; probability: number }[]>([]);
  const [ohlcData,     setOhlcData]     = useState<OhlcPoint[]>([]);
  const [chartShape,   setChartShape]   = useState<ChartShape>("line");
  const [chartLoading, setChartLoading] = useState(false);
  const [livePrices,   setLivePrices]   = useState<{ yes: number; no: number } | null>(null);
  const [isLocked,     setIsLocked]     = useState(false);
  const [wsResolved,   setWsResolved]   = useState<number | null>(null);

  const rangeRef = useRef<Range>(range);
  rangeRef.current = range;

  // Fetch chart history whenever market or range changes
  useEffect(() => {
    if (!market) return;
    const apiRange = RANGE_MAP[range];
    setChartLoading(true);
    setChartData([]);
    setOhlcData([]);
    const historyUrl = isConditionId(slug)
      ? `${API_BASE}/api/markets/${slug}/history?range=${apiRange}`
      : `${API_BASE}/api/markets/by-slug/${slug}/history?range=${apiRange}`;
    fetch(historyUrl)
      .then((r) => r.ok ? r.json() : { points: [], shape: "line" })
      .then((data: { points: ApiChartPoint[]; shape?: ChartShape }) => {
        const shape = data.shape ?? "line";
        const pts = data.points ?? [];
        setChartShape(shape);
        if (shape === "candlestick") {
          setOhlcData(pts.filter((pt): pt is OhlcPoint => pt.o != null).map((pt) => ({
            t: pt.t, o: pt.o!, h: pt.h!, l: pt.l!, c: pt.c!,
          })));
        } else {
          setOhlcData([]);
        }
        setChartData(
          pts.map((pt) => ({
            date:        formatRangeDate(pt.t, apiRange),
            probability: pt.p ?? pt.c ?? 0,
          }))
        );
      })
      .catch(() => { setChartData([]); setOhlcData([]); })
      .finally(() => setChartLoading(false));
  }, [market, range]);

  // Live price WebSocket — subscribes once the market loads, reconnects on drop
  useEffect(() => {
    if (!market) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1000;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(`${WS_BASE}/ws/prices`);

      ws.onopen = () => {
        backoff = 1000;
        ws!.send(JSON.stringify(
          isConditionId(slug) ? { action: 'subscribe', conditionId: slug } : { action: 'subscribe', slug }
        ));
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === 'price_update') {
            setLivePrices({ yes: msg.yes, no: msg.no });
          } else if (msg.type === 'market_resolved') {
            setWsResolved(msg.outcome ?? null);
          } else if (msg.type === 'market_locked') {
            setIsLocked(true);
          } else if (msg.type === 'history_point') {
            const currentRange = rangeRef.current;
            const apiRange = RANGE_MAP[currentRange];
            const expectedBucket = RANGE_BUCKET[apiRange];
            if (msg.bucket === expectedBucket) {
              const dateLabel = formatRangeDate(msg.t, apiRange);
              const closeVal: number = msg.c;
              setChartData((prev) => {
                if (prev.length > 0 && prev[prev.length - 1].date === dateLabel) {
                  const updated = [...prev];
                  updated[updated.length - 1] = { date: dateLabel, probability: closeVal };
                  return updated;
                }
                return [...prev, { date: dateLabel, probability: closeVal }];
              });
              setOhlcData((prev) => {
                const pt: OhlcPoint = { t: msg.t, o: msg.o, h: msg.h, l: msg.l, c: msg.c };
                if (prev.length > 0 && prev[prev.length - 1].t === msg.t) {
                  const updated = [...prev];
                  updated[updated.length - 1] = pt;
                  return updated;
                }
                return [...prev, pt];
              });
            }
          } else if (msg.type === 'error') {
            console.error('[ws/prices]', msg.message);
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
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(
            isConditionId(slug) ? { action: 'unsubscribe', conditionId: slug } : { action: 'unsubscribe', slug }
          ));
        }
        ws.close();
      }
    };
  }, [market, slug]);

  return { chartData, ohlcData, chartShape, chartLoading, livePrices, isLocked, wsResolved };
}
