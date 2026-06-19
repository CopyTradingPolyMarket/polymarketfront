"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, UTCTimestamp } from "lightweight-charts";

export interface OhlcPoint {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface Props {
  points: OhlcPoint[];
  height: number;
  isMobile: boolean;
}

export default function CandlestickChart({ points, height, isMobile }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#4b5563",
        fontSize: 9,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)", width: 1, style: 3 },
        horzLine: { color: "rgba(255,255,255,0.15)", width: 1, style: 3 },
      },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    const seen = new Map<number, { time: number; open: number; high: number; low: number; close: number }>();
    for (const pt of points) {
      const time = Math.floor(Date.parse(pt.t) / 1000);
      if (isNaN(time)) continue;
      seen.set(time, { time, open: pt.o, high: pt.h, low: pt.l, close: pt.c });
    }

    const data = [...seen.values()]
      .sort((a, b) => a.time - b.time)
      .map((d) => ({ ...d, time: d.time as UTCTimestamp }));

    series.setData(data);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [points, height, isMobile]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}
