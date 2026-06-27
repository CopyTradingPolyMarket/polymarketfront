import type { MappedMarket } from "@/app/markets/[slug]/_lib/types";

export function MarketStats({ market, isMobile }: { market: MappedMarket; isMobile: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
      {[
        { label: "24h Volume",    value: "$48.2K" },
        { label: "Total Volume",  value: market.volume },
        { label: "Liquidity",     value: "$312K" },
        { label: "Open Interest", value: "$198K" },
      ].map((stat) => (
        <div key={stat.label} style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>{stat.label}</p>
          <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
