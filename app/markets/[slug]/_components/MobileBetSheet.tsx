"use client";

import React, { useState, useRef } from "react";
import type { BetPanelProps } from "@/app/markets/[slug]/_components/betPanelProps";
import { useBetPanelDerived } from "@/app/markets/[slug]/_components/useBetPanelDerived";

export function MobileBetSheet({
  market, activeOption, setActiveOption,
  betType, setBetType, amount, setAmount,
  estimatedShares, potentialProfit, prob,
  handleTrade, tradeStatus, tradeMessage, authenticated,
  panelMode, setPanelMode, sellSide, setSellSide, sellDollars, setSellDollars, sellIsMax, setSellIsMax, userPosition, positionLoading, handleSell, sellStatus, sellMessage,
}: BetPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [sideHint, setSideHint] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY   = useRef<number | null>(null);

  const { activeOpt, isYes, holdingYes, holdingNo, holdingAny, maxShares, sideCents, maxDollarsDisplay, estShares } =
    useBetPanelDerived({ market, activeOption, betType, sellSide, sellDollars, userPosition });

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = startY.current - e.changedTouches[0].clientY;
    if (dy > 40) setExpanded(true);
    if (dy < -40) setExpanded(false);
    startY.current = null;
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          expanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        onClick={() => setExpanded(false)}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out"
        style={{
          transform: expanded ? "translateY(0)" : "translateY(calc(100% - 65px))",
          borderRadius: "20px 20px 0 0",
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <div
          className="flex items-center justify-between px-4 pb-3 cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{ background: panelMode === "sell" ? "rgba(239,68,68,0.15)" : (isYes ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"), color: panelMode === "sell" ? "#f87171" : (isYes ? "#34d399" : "#f87171") }}
            >
              {panelMode === "sell" ? "S" : (isYes ? "Y" : "N")}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{panelMode === "sell" ? "Sell" : activeOpt.label}</p>
              <p className="text-[10px]" style={{ color: isYes ? "#34d399" : "#f87171" }}>{prob}% chance</p>
            </div>
          </div>
          <button
            style={{
              padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "none",
              background: panelMode === "sell" ? "linear-gradient(135deg,#ef4444,#dc2626)" : (isYes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)"),
              color: "#fff", cursor: "pointer",
              boxShadow: panelMode === "sell" ? "0 2px 12px rgba(239,68,68,0.3)" : (isYes ? "0 2px 12px rgba(16,185,129,0.3)" : "0 2px 12px rgba(239,68,68,0.3)"),
            }}
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          >
            {panelMode === "sell" ? "Sell" : "Trade"}
          </button>
        </div>

        {expanded && (
          <div className="px-4 pb-6 pt-1" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {/* Buy / Sell toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
              {(["buy", "sell"] as const).map((m) => (
                <button key={m} onClick={() => setPanelMode(m)} style={{
                  padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "none",
                  background: panelMode === m ? (m === "buy" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                  color: panelMode === m ? (m === "buy" ? "#34d399" : "#f87171") : "#6b7280",
                }}>{m === "buy" ? "Buy" : "Sell"}</button>
              ))}
            </div>

            {/* BUY MODE */}
            {panelMode === "buy" && (<>
              <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Outcome</p>
              <div className="flex flex-col gap-2 mb-4">
                {market.options.map((opt: any, idx: number) => {
                  const active = activeOption === idx;
                  return (
                    <button key={idx} onClick={() => setActiveOption(idx)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                      border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: active ? "5px solid #fff" : "2px solid #374151", flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#fff" : "#9ca3af" }}>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: opt.probability >= 50 ? "#34d399" : "#f87171" }}>{opt.probability}%</span>
                    </button>
                  );
                })}
              </div>

              <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Position</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
                {(["yes", "no"] as const).map((t) => (
                  <button key={t} onClick={() => setBetType(t)} style={{
                    padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", border: "none",
                    background: betType === t ? (t === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                    color: betType === t ? (t === "yes" ? "#34d399" : "#f87171") : "#6b7280",
                  }}>{t === "yes" ? "Buy Yes" : "Buy No"}</button>
                ))}
              </div>

              <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Amount</p>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 16, fontWeight: 600, pointerEvents: "none" }}>$</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, paddingLeft: 30, paddingRight: 14, paddingTop: 13, paddingBottom: 13, color: "#fff", fontSize: 20, fontWeight: 700, outline: "none" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
                {["10", "25", "50", "100"].map((v) => (
                  <button key={v} onClick={() => setAmount(v)} style={{
                    padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: amount === v ? "rgba(255,255,255,0.08)" : "transparent",
                    color: amount === v ? "#fff" : "#6b7280",
                  }}>${v}</button>
                ))}
              </div>

              {estimatedShares && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                  {[{ label: "Shares", value: estimatedShares }, { label: "Avg price", value: `${(prob / 100).toFixed(2)}¢` }].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Potential profit</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>+${potentialProfit}</span>
                  </div>
                </div>
              )}

              {tradeStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "14px 0", borderRadius: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontSize: 13, fontWeight: 600 }}>
                  ✓ {tradeMessage}
                </div>
              ) : (
                <button onClick={handleTrade} disabled={tradeStatus === "loading"} style={{
                  width: "100%", padding: "15px 0", borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: tradeStatus === "loading" ? "not-allowed" : "pointer", border: "none",
                  opacity: tradeStatus === "loading" ? 0.65 : 1,
                  background: authenticated ? (isYes ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)") : "rgba(255,255,255,0.09)",
                  color: "#fff",
                  boxShadow: tradeStatus === "loading" || !authenticated ? "none" : isYes ? "0 4px 24px rgba(16,185,129,0.3)" : "0 4px 24px rgba(239,68,68,0.3)",
                }}>
                  {tradeStatus === "loading" ? "Placing…" : authenticated ? `${isYes ? "Buy Yes" : "Buy No"} · ${activeOpt.label}` : "Sign in to trade"}
                </button>
              )}
              {tradeStatus === "error" && <p style={{ textAlign: "center", fontSize: 11, color: "#f87171", marginTop: 8 }}>{tradeMessage}</p>}
              {tradeStatus === "idle" && !authenticated && <p style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 10 }}>Click to sign in and place a trade</p>}
            </>)}

            {/* SELL MODE */}
            {panelMode === "sell" && (
              positionLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : !holdingAny ? (
                <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", padding: "20px 0" }}>You don&apos;t hold any shares in this market</p>
              ) : (<>
                <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Sell side</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, gap: 4, marginBottom: sideHint ? 6 : 16 }}>
                  {([["YES", holdingYes], ["NO", holdingNo]] as const).map(([s, holds]) => (
                    <button key={s} onClick={() => {
                      if (holds) { setSellSide(s); setSideHint(null); }
                      else { setSideHint(`You don't hold any ${s} shares in this market`); }
                    }} style={{
                      padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                      cursor: holds ? "pointer" : "default", border: "none",
                      opacity: holds ? 1 : 0.3,
                      background: sellSide === s && holds ? (s === "YES" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                      color: sellSide === s && holds ? (s === "YES" ? "#34d399" : "#f87171") : "#6b7280",
                    }}>{s}</button>
                  ))}
                </div>
                {sideHint && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 12 }}>{sideHint}</p>}

                {sideCents <= 0 ? (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#f87171", padding: "12px 0" }}>Price unavailable — try again</p>
                ) : (<>
                  <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>$ amount to receive</p>
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 16, fontWeight: 600, pointerEvents: "none" }}>$</span>
                    <input type="number" value={sellDollars} onChange={(e) => setSellDollars(e.target.value)} placeholder="0"
                      style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, paddingLeft: 30, paddingRight: 70, paddingTop: 13, paddingBottom: 13, color: "#fff", fontSize: 20, fontWeight: 700, outline: "none" }}
                    />
                    <button onClick={() => setSellDollars(maxDollarsDisplay)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.12)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                      Max
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: estShares > 0 ? 4 : 12 }}>≈ ${maxDollarsDisplay} available · {maxShares.toFixed(2)} shares</p>
                  {estShares > 0 && <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>≈ {estShares.toFixed(2)} shares to sell</p>}
                  <p style={{ fontSize: 10, color: "#4b5563", marginBottom: 16 }}>Approximate — final amount depends on price at execution</p>

                  {sellStatus === "success" ? (
                    <div style={{ textAlign: "center", padding: "14px 0", borderRadius: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontSize: 13, fontWeight: 600 }}>
                      ✓ {sellMessage}
                    </div>
                  ) : (
                    <button onClick={handleSell} disabled={sellStatus === "loading"} style={{
                      width: "100%", padding: "15px 0", borderRadius: 14, fontSize: 15, fontWeight: 700,
                      cursor: sellStatus === "loading" ? "not-allowed" : "pointer", border: "none",
                      opacity: sellStatus === "loading" ? 0.65 : 1,
                      background: authenticated ? (sellSide === "YES" ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)") : "rgba(255,255,255,0.09)",
                      color: "#fff",
                      boxShadow: sellStatus === "loading" || !authenticated ? "none" : sellSide === "YES" ? "0 4px 24px rgba(16,185,129,0.3)" : "0 4px 24px rgba(239,68,68,0.3)",
                    }}>
                      {sellStatus === "loading" ? "Selling…" : authenticated ? `Sell ${sellSide}` : "Sign in to sell"}
                    </button>
                  )}
                  {sellStatus === "error" && <p style={{ textAlign: "center", fontSize: 11, color: "#f87171", marginTop: 8 }}>{sellMessage}</p>}
                </>)}
              </>)
            )}
          </div>
        )}
      </div>

      <div style={{ height: expanded ? 0 : 76 }} />
    </>
  );
}
