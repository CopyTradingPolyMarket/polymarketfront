import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { MappedMarket, RelatedMarket } from "@/app/markets/[slug]/_lib/types";

/** Props shared by both the mobile and desktop bet panels. */
export interface BetPanelProps {
  market: MappedMarket;
  activeOption: number;
  setActiveOption: Dispatch<SetStateAction<number>>;
  betType: "yes" | "no";
  setBetType: Dispatch<SetStateAction<"yes" | "no">>;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  estimatedShares: string | null;
  potentialProfit: string | null;
  prob: number;
  handleTrade: () => void;
  tradeStatus: "idle" | "loading" | "success" | "error";
  tradeMessage: string;
  authenticated: boolean;
  panelMode: "buy" | "sell";
  setPanelMode: Dispatch<SetStateAction<"buy" | "sell">>;
  sellSide: "YES" | "NO";
  setSellSide: Dispatch<SetStateAction<"YES" | "NO">>;
  sellDollars: string;
  setSellDollars: Dispatch<SetStateAction<string>>;
  sellIsMax: boolean;
  setSellIsMax: Dispatch<SetStateAction<boolean>>;
  userPosition: { yesShares: number; noShares: number; yesSharesMicro: number; noSharesMicro: number } | null;
  positionLoading: boolean;
  handleSell: () => void;
  sellStatus: "idle" | "loading" | "success" | "error";
  sellMessage: string;
}

/** Desktop panel additionally receives the router and a related-markets list. */
export interface DesktopBetPanelProps extends BetPanelProps {
  router: ReturnType<typeof useRouter>;
  relatedMarkets: RelatedMarket[];
}
