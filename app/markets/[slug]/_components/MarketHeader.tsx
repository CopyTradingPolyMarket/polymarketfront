import type { MappedMarket } from "@/app/markets/[slug]/_lib/types";

export function MarketHeader({ market, isMobile }: { market: MappedMarket; isMobile: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <img src={market.image} alt={market.title}
        style={{ width: isMobile ? 48 : 60, height: isMobile ? 48 : 60, borderRadius: 14, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, background: "#1a1a1e" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.025em", margin: 0 }}>{market.title}</h1>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {[market.volume, "Closes Dec 31, 2026", "1,204 traders"].map((item, i) => (
            <span key={i} style={{ fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap" }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
