export interface BreakingItem {
  id: number;
  title: string;
  percent: number;
  delta: number;
}

export interface HotTopic {
  rank: number;
  label: string;
  volume: string;
  category: string;
}

export interface LiveEvent {
  id: number;
  title: string;
  endsIn: string;
  participants: number;
  volume: string;
  badge: string;
}

export interface TrendingMarket {
  id: number;
  title: string;
  category: string;
  change: number;
  yes: number;
}

export interface TopCategory {
  icon: string;
  label: string;
  markets: number;
  volume: string;
  color: string;
  accent: string;
}
