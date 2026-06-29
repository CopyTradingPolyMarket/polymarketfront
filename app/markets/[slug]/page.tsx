"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Comments from "@/src/components/Comments";
import { useAuth } from "@/src/providers/AuthProvider";
import { usePrivy } from "@privy-io/react-auth";
import LiveCryptoChart from "@/src/components/LiveCryptoChart";
import { formatLiveCryptoTitle } from "@/lib/liveCryptoTitle";

// ─── API ──────────────────────────────────────────────────────────────────────

import { API_BASE } from "@/src/config/api";
import { useIsMobile } from "@/src/hooks/useIsMobile";
import type { RelatedMarket, Range } from "@/app/markets/[slug]/_lib/types";
import { TRADE_ERRORS, SELL_ERRORS } from "@/app/markets/[slug]/_lib/constants";
import { MobileBetSheet } from "@/app/markets/[slug]/_components/MobileBetSheet";
import { DesktopBetPanel } from "@/app/markets/[slug]/_components/DesktopBetPanel";
import { MarketHeader } from "@/app/markets/[slug]/_components/MarketHeader";
import { SpotChart } from "@/app/markets/[slug]/_components/SpotChart";
import { MarketChart } from "@/app/markets/[slug]/_components/MarketChart";
import { MarketStats } from "@/app/markets/[slug]/_components/MarketStats";
import { useMarketDetail } from "@/app/markets/[slug]/_hooks/useMarketDetail";
import { usePosition } from "@/app/markets/[slug]/_hooks/usePosition";
import { useRelatedMarkets } from "@/app/markets/[slug]/_hooks/useRelatedMarkets";
import { useSpotChart } from "@/app/markets/[slug]/_hooks/useSpotChart";
import { useMarketChart } from "@/app/markets/[slug]/_hooks/useMarketChart";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const params    = useParams();
  const router    = useRouter();
  const slug      = params.slug as string;
  const isMobile  = useIsMobile();

  const { authenticated, refetchUser } = useAuth();
  const { getAccessToken, login }      = usePrivy();

  // ── UI state (stays in the page) ──
  const [activeOption, setActiveOption] = useState(0);
  const [range,        setRange]        = useState<Range>("1D");
  const [betType,      setBetType]      = useState<"yes" | "no">("yes");
  const [amount,       setAmount]       = useState("");
  const [tradeStatus,    setTradeStatus]    = useState<"idle" | "loading" | "success" | "error">("idle");
  const [tradeMessage,   setTradeMessage]   = useState("");
  const [panelMode,      setPanelMode]      = useState<"buy" | "sell">("buy");
  const [sellSide,       setSellSide]       = useState<"YES" | "NO">("YES");
  const [sellDollars,    setSellDollars]    = useState("");
  const [sellIsMax,      setSellIsMax]      = useState(false);
  const [sellStatus,     setSellStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sellMessage,    setSellMessage]    = useState("");

  // ── Data hooks (each owns its own state + effects) ──
  const { market, notFound, loadError, marketTags, marketSlug } = useMarketDetail(slug, router);
  const { userPosition, positionLoading, refetchPosition } = usePosition(market, authenticated, getAccessToken, panelMode);
  const relatedMarkets = useRelatedMarkets(marketTags, marketSlug);
  const spotSymbol = market?.isLiveCrypto ? market.spot?.symbol : undefined;
  const { spotData, spotLoading } = useSpotChart(spotSymbol);
  const { chartData, ohlcData, chartShape, chartLoading, livePrices, isLocked, wsResolved } = useMarketChart(market, slug, range);

  const handleTrade = useCallback(async () => {
    if (!market) return;
    if (!authenticated) { login(); return; }
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      setTradeStatus("error");
      setTradeMessage("Enter an amount greater than $0");
      return;
    }
    setTradeStatus("loading");
    setTradeMessage("");
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          conditionId: market.id,
          side:        betType === "yes" ? "YES" : "NO",
          amount:      Math.round(amtNum * 1_000_000),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeStatus("error");
        setTradeMessage(TRADE_ERRORS[data.code] ?? data.error ?? "Trade failed");
        return;
      }
      const sharesStr = data.shares    != null ? ` · ${Number(data.shares).toFixed(2)} shares`            : "";
      const priceStr  = data.entryPrice != null ? ` at ${(data.entryPrice / 10).toFixed(1)}¢` : "";
      setTradeStatus("success");
      setTradeMessage(`Bought${sharesStr}${priceStr}`);
      setAmount("");
      refetchUser();
      refetchPosition();
      setTimeout(() => setTradeStatus("idle"), 4000);
    } catch {
      setTradeStatus("error");
      setTradeMessage("Network error — try again");
    }
  }, [market, authenticated, login, getAccessToken, amount, betType, refetchUser, refetchPosition]);

  const handleSell = useCallback(async () => {
    if (!market) return;
    if (!authenticated) { login(); return; }

    const maxSh    = sellSide === "YES" ? (userPosition?.yesShares    ?? 0) : (userPosition?.noShares    ?? 0);
    const maxMicro = sellSide === "YES" ? (userPosition?.yesSharesMicro ?? 0) : (userPosition?.noSharesMicro ?? 0);

    let sharesToSell: number;
    let microShares: number;

    if (sellIsMax) {
      // Bypass dollar round-trip: sell exactly the held shares
      sharesToSell = maxSh;
      microShares  = maxMicro;
    } else {
      const dollarsNum = Number(sellDollars);
      if (!dollarsNum || dollarsNum <= 0) {
        setSellStatus("error");
        setSellMessage("Enter a dollar amount greater than $0");
        return;
      }
      const sideOpt = market.options.find((o: { label: string }) =>
        o.label.toLowerCase() === (sellSide === "YES" ? "yes" : "no")
      );
      const sideCents = sideOpt?.probability ?? 0;
      if (sideCents <= 0) {
        setSellStatus("error");
        setSellMessage("Price unavailable — try again");
        return;
      }
      const uncappedShares = dollarsNum / (sideCents / 100);
      if (uncappedShares > maxSh + 0.001) {
        setSellStatus("error");
        setSellMessage("Amount exceeds available position");
        return;
      }
      sharesToSell = Math.min(maxSh, uncappedShares);
      microShares  = Math.min(maxMicro, Math.round(sharesToSell * 1_000_000));
    }

    setSellStatus("loading");
    setSellMessage("");
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/trades/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conditionId: market.id, side: sellSide, shares: microShares }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSellStatus("error");
        setSellMessage(SELL_ERRORS[data.code] ?? data.error ?? "Sell failed");
        return;
      }
      const proceedsStr = data.proceeds != null ? ` for $${Number(data.proceeds).toFixed(2)}` : "";
      setSellStatus("success");
      setSellMessage(`Sold ~${sharesToSell.toFixed(2)} shares${proceedsStr}`);
      setSellDollars("");
      setSellIsMax(false);
      await refetchPosition();
      refetchUser();
      setTimeout(() => setSellStatus("idle"), 4000);
    } catch {
      setSellStatus("error");
      setSellMessage("Network error — try again");
    }
  }, [market, authenticated, login, getAccessToken, sellDollars, sellIsMax, sellSide, userPosition, refetchPosition, refetchUser]);

  // Reset trade status when navigating to a different market
  // (was the leading reset inside the market-detail fetch effect; that fetch now lives in useMarketDetail)
  useEffect(() => {
    setTradeStatus("idle");
    setTradeMessage("");
  }, [slug]);

  // Auto-select sell side to whichever the user holds when position data arrives
  useEffect(() => {
    if (panelMode !== "sell") return;
    const holdingYes = (userPosition?.yesShares ?? 0) > 0;
    const holdingNo  = (userPosition?.noShares  ?? 0) > 0;
    if (!holdingYes && holdingNo) setSellSide("NO");
    else if (holdingYes) setSellSide("YES");
  }, [panelMode, userPosition]);

  // Reset status messages when switching buy/sell mode
  useEffect(() => {
    setTradeStatus("idle"); setTradeMessage("");
    setSellStatus("idle");  setSellMessage("");
  }, [panelMode]);

  // Merge live WS prices into the options array (no-op when WS is quiet)
  const liveOptions = useMemo(() => {
    if (!market || !livePrices) return null;
    return market.options.map((opt) => ({
      ...opt,
      probability: opt.label.toLowerCase() === 'yes'
        ? Math.round(livePrices.yes)
        : opt.label.toLowerCase() === 'no'
        ? Math.round(livePrices.no)
        : opt.probability,
    }));
  }, [market, livePrices]);

  // ── Early returns ──

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 16 }}>
      <p style={{ fontSize: 32, fontWeight: 800 }}>404</p>
      <p style={{ color: "#6b7280" }}>Market not found</p>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Go back</button>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 16 }}>
      <p style={{ color: "#6b7280" }}>Couldn&apos;t load this market. Please try again.</p>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← Go back</button>
    </div>
  );

  if (!market) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const effectiveMarket = liveOptions ? { ...market, options: liveOptions } : market;
  const activeOpt       = effectiveMarket.options[activeOption];
  const isYes           = betType === "yes";
  const prob            = activeOpt.probability;
  const estimatedShares = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? (Number(amount) / (prob / 100)).toFixed(2) : null;
  const potentialProfit = amount && !isNaN(Number(amount)) && Number(amount) > 0
    ? ((Number(amount) / (prob / 100)) - Number(amount)).toFixed(2) : null;
  const trend   = chartData.length > 1 ? chartData[chartData.length - 1].probability - chartData[0].probability : 0;
  const trendUp = trend >= 0;

  // Market is done: resolved, locked, or expired 5-min window
  const isExpired5m = (() => {
    const m = market.slug?.match(/-updown-(\d+)m-(\d+)$/);
    if (!m) return false;
    const duration = parseInt(m[1]) * 60;
    const ts = parseInt(m[2]);
    return ts + duration < Date.now() / 1000;
  })();
  const isDone = wsResolved !== null || isLocked || isExpired5m || market.resolved === true;
  const doneLabel = wsResolved !== null
    ? `Resolved · ${wsResolved === 1 ? "UP" : "DOWN"}`
    : isExpired5m ? "Window Expired"
    : isLocked ? "Market Locked"
    : "Market Closed";

  const sharedPanelProps = { market: effectiveMarket, activeOption, setActiveOption, betType, setBetType, amount, setAmount, estimatedShares, potentialProfit, prob, router, handleTrade, tradeStatus, tradeMessage, authenticated, panelMode, setPanelMode, sellSide, setSellSide, sellDollars, setSellDollars, sellIsMax, setSellIsMax, userPosition, positionLoading, handleSell, sellStatus, sellMessage };
  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(9,9,11,0.88)",
        backdropFilter: "blur(20px)",
        padding: isMobile ? "0 16px" : "0 24px",
        height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {!isMobile && "Back"}
        </button>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        <span style={{ color: "#9ca3af", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {market.title}
        </span>
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
            {["🔖", "🎁"].map((icon) => (
              <button key={icon} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#9ca3af", fontSize: 15, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── BODY ── */}
      <div style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "32px 24px",
        display: isMobile ? "block" : "grid",
        gridTemplateColumns: isMobile ? undefined : "1fr 352px",
        gap: 24,
        alignItems: "start",
      }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 20 }}>

          {/* Header */}
          <MarketHeader market={market} isMobile={isMobile} />

          {/* Resolved / locked badge — shown only when WS sends the signal */}
          {(wsResolved !== null || isLocked) && (
            <div style={{ display: "flex", gap: 8 }}>
              {wsResolved !== null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 100, padding: "4px 12px" }}>
                  Resolved · {wsResolved === 1 ? "YES" : "NO"}
                </span>
              )}
              {isLocked && wsResolved === null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 100, padding: "4px 12px" }}>
                  Market Locked
                </span>
              )}
            </div>
          )}

          {/* Option pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {effectiveMarket.options.map((opt: any, idx: number) => {
              const active = activeOption === idx;
              return (
                <button key={idx} onClick={() => setActiveOption(idx)} style={{
                  padding: "7px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  background: active ? "rgba(255,255,255,0.09)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                }}>
                  {opt.label}
                  <span style={{
                    marginLeft: 7, padding: "2px 7px", borderRadius: 100, fontSize: 10,
                    background: active ? (opt.probability >= 50 ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)") : "rgba(255,255,255,0.05)",
                    color: active ? (opt.probability >= 50 ? "#60a5fa" : "#f87171") : "#6b7280",
                  }}>{opt.probability}%</span>
                </button>
              );
            })}
          </div>

          {/* Spot chart — primary chart for live-crypto markets */}
          {market.isLiveCrypto && spotSymbol && (
            <SpotChart spotSymbol={spotSymbol} spotData={spotData} spotLoading={spotLoading} isMobile={isMobile} priceToBeat={market.line} />
          )}

          {/* Chart */}
          <MarketChart
            chartData={chartData}
            ohlcData={ohlcData}
            chartShape={chartShape}
            chartLoading={chartLoading}
            range={range}
            setRange={setRange}
            prob={prob}
            activeOpt={activeOpt}
            trend={trend}
            trendUp={trendUp}
            isMobile={isMobile}
          />

          {/* Stats */}
          <MarketStats market={market} isMobile={isMobile} />

          <Comments conditionId={market.id} eventId={market.eventId}/>

          {/* Related markets — mobile only */}
          {isMobile && relatedMarkets.length > 0 && (
            <div style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 12 }}>Related markets</p>
              {relatedMarkets.map((m: RelatedMarket, i: number) => (
                <button key={m.slug} onClick={() => router.push(`/markets/${m.slug}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 0", background: "none", border: "none", borderBottom: i < relatedMarkets.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", textAlign: "left" }}>
                  {m.image && <img src={m.image} alt={m.title} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", background: "#1a1a1e", flexShrink: 0 }} />}
                  {!m.image && <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1a1a1e", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, margin: "2px 0 0" }}>{m.options[0]?.probability ?? 0}% Yes</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — desktop only */}
        {!isMobile && <DesktopBetPanel {...sharedPanelProps} relatedMarkets={relatedMarkets} />}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileBetSheet
          {...sharedPanelProps}
          estimatedShares={estimatedShares}
          potentialProfit={potentialProfit}
        />
      )}
    </div>
  );
}
