import type { BetPanelProps } from "@/app/markets/[slug]/_components/betPanelProps";

type BetPanelDerivedInputs = Pick<
  BetPanelProps,
  "market" | "activeOption" | "betType" | "sellSide" | "sellDollars" | "userPosition"
>;

/** Shared derived math used by both the desktop and mobile bet panels. */
export function useBetPanelDerived({ market, activeOption, betType, sellSide, sellDollars, userPosition }: BetPanelDerivedInputs) {
  const activeOpt  = market.options[activeOption];
  const isYes      = betType === "yes";
  const holdingYes = (userPosition?.yesShares ?? 0) > 0;
  const holdingNo  = (userPosition?.noShares  ?? 0) > 0;
  const holdingAny = holdingYes || holdingNo;
  const maxShares  = sellSide === "YES" ? (userPosition?.yesShares ?? 0) : (userPosition?.noShares ?? 0);
  const sideCents  = (market.options.find((o: any) => o.label.toLowerCase() === (sellSide === "YES" ? "yes" : "no"))?.probability ?? 0) as number;
  const maxDollars = sideCents > 0 ? maxShares * (sideCents / 100) : 0;
  const maxDollarsDisplay = (Math.floor(maxDollars * 100) / 100).toFixed(2);
  const estShares  = sideCents > 0 && Number(sellDollars) > 0 ? Number(sellDollars) / (sideCents / 100) : 0;
  return { activeOpt, isYes, holdingYes, holdingNo, holdingAny, maxShares, sideCents, maxDollars, maxDollarsDisplay, estShares };
}
