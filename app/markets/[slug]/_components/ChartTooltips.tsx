export function CustomTooltip({ active, payload, label, trendUp }: any) {
  if (!active || !payload?.length) return null;
  const color = trendUp ? "#60a5fa" : "#f87171";
  return (
    <div style={{
      background: "rgba(10,10,13,0.97)",
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: "8px 14px",
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 16px ${color}18`,
    }}>
      <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: 15 }}>{payload[0].value}%</p>
    </div>
  );
}

export function SpotTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,10,13,0.97)",
      border: "1px solid rgba(96,165,250,0.2)",
      borderRadius: 10,
      padding: "8px 14px",
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15 }}>${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
}
