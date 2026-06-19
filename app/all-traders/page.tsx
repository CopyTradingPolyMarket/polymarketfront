import TradersPageClient from "@/src/components/TradesPageClient";
import type { TraderProfile } from "@/types/Traderprofile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ApiTraderListItem {
  slug: string;
  name: string | null;
  handle: string | null;
  avatar: string;
  avatarUrl: string | null;
  avatarGrad: string | null;
  tier: "bronze" | "silver" | "gold" | "diamond";
  isVerified: boolean;
  followers: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  streak: number;
  volumeTraded: number;
}

function formatPnl(usdc: number): string {
  const sign = usdc >= 0 ? "+" : "-";
  const abs = Math.abs(usdc);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString()}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatVolume(usdc: number): string {
  if (usdc >= 1_000_000) return `$${(usdc / 1_000_000).toFixed(1)}M`;
  if (usdc >= 1_000) return `$${(usdc / 1_000).toFixed(0)}K`;
  return `$${usdc.toFixed(2)}`;
}

function mapTrader(api: ApiTraderListItem): TraderProfile {
  return {
    slug:             api.slug,
    name:             api.name ?? api.slug,
    handle:           `@${api.slug}`,
    avatar:           api.avatar,
    avatarUrl:        api.avatarUrl,
    avatarGrad:       api.avatarGrad,
    bio:              "",
    location:         "",
    joined:           "",
    followers:        api.followers,
    following:        0,
    totalPnl:         formatPnl(api.totalPnl),
    totalPnlRaw:      api.totalPnl,
    totalPnlPercent:  Math.round(api.totalPnlPercent),
    winRate:          Math.round(api.winRate),
    totalTrades:      api.totalTrades,
    avgReturn:        Math.round(api.avgReturn),
    bestTrade:        "—",
    bestTradePercent: 0,
    streak:           api.streak,
    volumeTraded:     formatVolume(api.volumeTraded),
    volumeTradedRaw:  api.volumeTraded,
    isVerified:       api.isVerified,
    tier:             api.tier,
  };
}

export default async function TradersPage() {
  const res = await fetch(`${API_BASE}/api/traders?limit=100&sortBy=pnl`, { cache: "no-store" });

  let traders: TraderProfile[] = [];

  if (res.ok) {
    const data = (await res.json()) as { traders: ApiTraderListItem[] };
    traders = data.traders.filter((t) => t.totalTrades > 0).map(mapTrader);
  }

  if (traders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c0e" }}>
        <div className="text-center">
          <p className="text-gray-400 text-sm">No traders found.</p>
          <p className="text-gray-600 text-xs mt-1">Check back later.</p>
        </div>
      </div>
    );
  }

  return <TradersPageClient traders={traders} />;
}
