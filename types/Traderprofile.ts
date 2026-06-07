export interface TraderProfile {
  slug: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  totalPnl: string;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  bestTrade: string;
  bestTradePercent: number;
  streak: number;
  volumeTraded: string;
  isVerified: boolean;
  tier: "bronze" | "silver" | "gold" | "diamond";
}

export interface TraderTrade {
  id: number;
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
  avatarGrad: string;
  pnl: string;
  winRate: number;
  isUp: boolean;
}
