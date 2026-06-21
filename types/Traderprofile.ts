export interface TraderProfile {
  slug: string;
  name: string;
  handle: string;
  avatar: string;
  avatarUrl: string | null;
  avatarGrad: string | null;
  bio: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  totalPnl: string;
  totalPnlRaw: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  bestTrade: string;
  bestTradePercent: number;
  streak: number;
  volumeTraded: string;
  volumeTradedRaw: number;
  isVerified: boolean;
  tier: "bronze" | "silver" | "gold" | "diamond";
}

export interface TraderTrade {
  id: string;
  market: string;
  category: string;
  side: "YES" | "NO";
  entry: number;
  exit: number | null;
  pnl: string;
  pnlPercent: number;
  status: "open" | "won" | "lost";
  date: string;
}

export interface EarningsPoint {
  date: string;
  value: number;
  pnl: number;
}

export interface SuggestedTrader {
  slug: string;
  name: string;
  handle: string;
  avatar: string;
  avatarGrad: string | null;
  pnl: string;
  winRate: number;
  isUp: boolean;
}
