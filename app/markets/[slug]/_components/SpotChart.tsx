import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SpotTooltip } from "@/app/markets/[slug]/_components/ChartTooltips";

export function SpotChart({ spotSymbol, spotData, spotLoading, isMobile }: {
  spotSymbol: string;
  spotData: { date: string; value: number }[];
  spotLoading: boolean;
  isMobile: boolean;
}) {
  return (
    <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: isMobile ? "16px 14px 10px" : "20px 20px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb", textTransform: "uppercase" }}>
            {spotSymbol}
          </span>
          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>live · 30s</span>
          {spotData.length > 0 && (
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginLeft: 12 }}>
              ${spotData[spotData.length - 1].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
      <div style={{ position: "relative" }}>
        {spotLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        <div style={{ opacity: spotLoading ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {spotData.length === 0 && !spotLoading ? (
            <div style={{ height: isMobile ? 120 : 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#4b5563" }}>Waiting for spot price data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
              <AreaChart data={spotData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#34d399" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(spotData.length / (isMobile ? 3 : 5)))} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Tooltip content={(p) => <SpotTooltip {...p} />} />
                <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#spotGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
