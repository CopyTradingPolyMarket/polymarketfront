"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface SpotPoint {
  date: string;
  value: number;
}

interface Props {
  spotData: SpotPoint[];
  priceToBeat: number | null;
  spotSymbol: string;
  slug: string;
  isMobile: boolean;
  spotLoading: boolean;
}

function fmtPrice(v: number): string {
  const abs = Math.abs(v);
  const digits = abs < 10 ? 4 : abs < 1000 ? 3 : 2;
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function parseWindowFromSlug(slug: string): { startSec: number; durationSec: number } | null {
  const m = slug.match(/-updown-(\d+)m-(\d+)$/);
  if (!m) {
    const daily = slug.match(/-up-or-down-/);
    if (daily) return { startSec: 0, durationSec: 86400 };
    return null;
  }
  return { startSec: parseInt(m[2]), durationSec: parseInt(m[1]) * 60 };
}

function Countdown({ endSec }: { endSec: number }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, endSec - now);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const urgent = remaining < 60;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: urgent ? "#f87171" : "#e5e7eb", letterSpacing: "-0.02em" }}>
        {String(mm).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>m</span>
      <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: urgent ? "#f87171" : "#e5e7eb", letterSpacing: "-0.02em" }}>
        {String(ss).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>s</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,10,13,0.97)", border: "1px solid rgba(247,147,26,0.3)", borderRadius: 8, padding: "6px 12px", backdropFilter: "blur(12px)" }}>
      <p style={{ color: "#6b7280", fontSize: 9, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#f7931a", fontWeight: 700, fontSize: 14 }}>
        ${fmtPrice(Number(payload[0].value))}
      </p>
    </div>
  );
}

export default function LiveCryptoChart({ spotData, priceToBeat, spotSymbol, slug, isMobile, spotLoading }: Props) {
  const window = parseWindowFromSlug(slug);
  const endSec = window && window.startSec > 0 ? window.startSec + window.durationSec : 0;

  const currentPrice = spotData.length > 0 ? spotData[spotData.length - 1].value : null;
  const delta = currentPrice !== null && priceToBeat !== null ? currentPrice - priceToBeat : null;
  const above = delta !== null ? delta >= 0 : null;

  // Compute Y domain that always includes the target line
  const yDomain: [number, number] | ["auto", "auto"] = (() => {
    if (spotData.length === 0) return ["auto", "auto"] as ["auto", "auto"];
    let lo = Infinity;
    let hi = -Infinity;
    for (const pt of spotData) {
      if (pt.value < lo) lo = pt.value;
      if (pt.value > hi) hi = pt.value;
    }
    if (priceToBeat !== null) {
      if (priceToBeat < lo) lo = priceToBeat;
      if (priceToBeat > hi) hi = priceToBeat;
    }
    const pad = Math.max((hi - lo) * 0.15, 1);
    return [lo - pad, hi + pad];
  })();

  return (
    <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: isMobile ? "16px 14px 12px" : "20px 20px 14px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        {/* Price to beat */}
        <div>
          <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Price to beat</p>
          <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#e5e7eb", letterSpacing: "-0.02em", margin: 0 }}>
            {priceToBeat !== null ? `$${fmtPrice(priceToBeat)}` : "—"}
          </p>
        </div>

        {/* Current price + delta */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Current price</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {delta !== null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: above ? "#34d399" : "#f87171" }}>
                {above ? "▲" : "▼"} ${fmtPrice(Math.abs(delta))}
              </span>
            )}
            <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#f7931a", letterSpacing: "-0.02em" }}>
              {currentPrice !== null ? `$${fmtPrice(currentPrice)}` : "—"}
            </span>
          </div>
        </div>

        {/* Countdown */}
        {endSec > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Time left</p>
            <Countdown endSec={endSec} />
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ position: "relative" }}>
        {spotLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(247,147,26,0.6)", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        <div style={{ opacity: spotLoading ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {spotData.length === 0 && !spotLoading ? (
            <div style={{ height: isMobile ? 180 : 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#4b5563" }}>Waiting for spot price data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
              <AreaChart data={spotData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lcSpotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7931a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#4b5563", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(spotData.length / (isMobile ? 3 : 5)))}
                />
                <YAxis
                  orientation="right"
                  domain={yDomain}
                  tick={{ fill: "#4b5563", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${fmtPrice(Number(v))}`}
                  width={70}
                />
                {priceToBeat !== null && (
                  <ReferenceLine
                    y={priceToBeat}
                    stroke="#d4a054"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{
                      value: `Target $${fmtPrice(priceToBeat)}`,
                      fill: "#d4a054",
                      fontSize: 9,
                      position: "right",
                    }}
                  />
                )}
                <Tooltip content={(p: any) => <ChartTooltip {...p} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f7931a"
                  strokeWidth={2}
                  fill="url(#lcSpotGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#f7931a" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Symbol badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>
          {spotSymbol}
        </span>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 10, color: "#4b5563" }}>live · 30s</span>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    </div>
  );
}
