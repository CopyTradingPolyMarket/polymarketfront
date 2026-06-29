import type { Dispatch, SetStateAction } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import CandlestickChart from "@/src/components/CandlestickChart";
import type { OhlcPoint } from "@/src/components/CandlestickChart";
import { CustomTooltip } from "@/app/markets/[slug]/_components/ChartTooltips";
import { RANGES } from "@/app/markets/[slug]/_lib/constants";
import type { ChartShape, Range } from "@/app/markets/[slug]/_lib/types";

export function MarketChart({ chartData, ohlcData, chartShape, chartLoading, range, setRange, prob, activeOpt, trend, trendUp, isMobile }: {
  chartData: { date: string; probability: number }[];
  ohlcData: OhlcPoint[];
  chartShape: ChartShape;
  chartLoading: boolean;
  range: Range;
  setRange: Dispatch<SetStateAction<Range>>;
  prob: number;
  activeOpt: { label: string; probability: number };
  trend: number;
  trendUp: boolean;
  isMobile: boolean;
}) {
  return (
    <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: isMobile ? "16px 14px 10px" : "20px 20px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: isMobile ? 36 : 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{prob}%</span>
            {chartData.length > 1 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: trendUp ? "#60a5fa" : "#f87171" }}>
                {trendUp ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            chance of <strong style={{ color: "#9ca3af" }}>{activeOpt.label}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: isMobile ? "4px 8px" : "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8,
              cursor: "pointer", border: "none",
              background: range === r ? "rgba(255,255,255,0.1)" : "transparent",
              color: range === r ? "#fff" : "#6b7280",
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        {chartLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        <div style={{ opacity: chartLoading ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {chartData.length === 0 && !chartLoading ? (
            <div style={{ height: isMobile ? 160 : 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#4b5563" }}>No price history available for this range.</p>
            </div>
          ) : chartShape === "candlestick" && ohlcData.length > 0 ? (
            <CandlestickChart points={ohlcData} height={isMobile ? 160 : 220} isMobile={isMobile} />
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={trendUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / (isMobile ? 3 : 5)))} />
                <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={(p) => <CustomTooltip {...p} trendUp={trendUp} />} />
                <Area type="monotone" dataKey="probability" stroke={trendUp ? "#10b981" : "#ef4444"} strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
