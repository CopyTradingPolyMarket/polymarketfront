import { notFound } from "next/navigation";
import TraderProfileClient from "@/src/components/TraderProfileClient";
import SuggestedTradersSidebar from "@/src/components/SuggestedTradersSidebar";
import type { TraderProfile, TraderTrade, EarningsPoint, SuggestedTrader } from "@/types/Traderprofile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── API response shapes ───────────────────────────────────────────────────────

interface ApiProfile {
  id: string;
  slug: string;
  name: string | null;
  handle: string | null;
  avatar: string;
  avatarUrl: string | null;
  avatarGrad: string | null;
  tier: "bronze" | "silver" | "gold" | "diamond";
  isVerified: boolean;
  bio: string | null;
  location: string | null;
  joined: string;
  followers: number;
  following: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  bestTrade: string | null;
  bestTradePercent: number;
  streak: number;
  volumeTraded: number;
}

interface ApiTrade {
  id: string;
  market: string;
  category: string;
  type: "buy" | "sell";
  side: "YES" | "NO";
  entry: number;
  exit: number | null;
  pnl: number;
  pnlPercent: number;
  status: "open" | "won" | "lost" | "closed";
  shares: number;
  date: string;
}

interface ApiTradesResponse {
  trades: ApiTrade[];
  total: number;
  page: number;
  totalPages: number;
}

type ApiEarningsPoint = EarningsPoint; // shapes match: { date, value, pnl } all USDC floats

interface ApiTraderListItem {
  slug: string;
  name: string | null;
  avatar: string;
  avatarGrad: string | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
}

function mapSuggestedTrader(api: ApiTraderListItem): SuggestedTrader {
  return {
    slug:       api.slug,
    name:       api.name ?? api.slug,
    handle:     `@${api.slug}`,
    avatar:     api.avatar,
    avatarGrad: api.avatarGrad,
    pnl:        formatPnl(api.totalPnl),
    winRate:    Math.round(api.winRate),
    isUp:       api.totalPnl >= 0,
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────────

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

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapProfile(api: ApiProfile): TraderProfile {
  const displayName = api.handle ?? api.slug;
  return {
    slug:             api.slug,
    name:             api.name ?? api.slug,
    handle:           `@${displayName}`,
    avatar:           api.avatar,
    avatarUrl:        api.avatarUrl,
    avatarGrad:       api.avatarGrad,
    bio:              api.bio ?? "",
    location:         api.location ?? "",
    joined:           api.joined,
    followers:        api.followers,
    following:        api.following,
    totalPnl:         formatPnl(api.totalPnl),
    totalPnlPercent:  Math.round(api.totalPnlPercent),
    winRate:          Math.round(api.winRate),
    totalTrades:      api.totalTrades,
    avgReturn:        Math.round(api.avgReturn),
    bestTrade:        api.bestTrade ?? "—",
    bestTradePercent: Math.round(api.bestTradePercent),
    streak:           api.streak,
    volumeTraded:     formatVolume(api.volumeTraded),
    isVerified:       api.isVerified,
    tier:             api.tier,
  };
}

function mapTrade(api: ApiTrade): TraderTrade {
  return {
    id:         api.id,
    market:     api.market,
    category:   api.category,
    side:       api.side,
    entry:      api.entry,
    exit:       api.exit,
    pnl:        formatPnl(api.pnl),
    pnlPercent: Math.round(api.pnlPercent),
    status:     api.status as "open" | "won" | "lost",
    date:       api.date,
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TraderProfilePage({ params }: Props) {
  const { slug } = await params;

  const [profileRes, tradesRes, earningsRes, suggestedRes] = await Promise.all([
    fetch(`${API_BASE}/api/traders/${slug}`,          { cache: "no-store" }),
    fetch(`${API_BASE}/api/traders/${slug}/trades?limit=50`, { cache: "no-store" }),
    fetch(`${API_BASE}/api/traders/${slug}/earnings`, { cache: "no-store" }),
    fetch(`${API_BASE}/api/traders?limit=10&sortBy=pnl`, { cache: "no-store" }),
  ]);

  if (profileRes.status === 404) notFound();

  if (!profileRes.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c0e" }}>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Failed to load trader profile.</p>
          <p className="text-gray-600 text-xs mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  const apiProfile: ApiProfile = await profileRes.json();

  const apiTrades: ApiTrade[] = tradesRes.ok
    ? ((await tradesRes.json()) as ApiTradesResponse).trades
    : [];

  const apiEarnings: ApiEarningsPoint[] = earningsRes.ok
    ? await earningsRes.json()
    : [];

  const apiSuggested: ApiTraderListItem[] = suggestedRes.ok
    ? ((await suggestedRes.json()) as { traders: ApiTraderListItem[] }).traders
    : [];

  const profile   = mapProfile(apiProfile);
  // "closed" = sell exit — exclude from buy-side trade history display
  const trades    = apiTrades.filter((t) => t.status !== "closed").map(mapTrade);
  const earnings  = apiEarnings;
  const suggested = apiSuggested
    .filter((t) => t.totalTrades > 0)
    .map(mapSuggestedTrader);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-4 flex gap-6">
        <div className="flex-1 min-w-0">
          <TraderProfileClient profile={profile} trades={trades} earnings={earnings} />
        </div>
        <div className="hidden lg:block pt-6">
          <SuggestedTradersSidebar traders={suggested} currentSlug={slug} />
        </div>
      </div>
    </div>
  );
}
