import type { TraderProfile, TraderTrade, EarningsPoint, SuggestedTrader } from "@/src/types/traderProfile";

// Helper to generate plausible earnings curve
function makeEarnings(peak: number): EarningsPoint[] {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let val = 0;
  return months.map((date, i) => {
    const pnl = Math.round((peak / 12) * (0.6 + Math.random() * 0.8) * (i % 3 === 2 ? -0.4 : 1));
    val += pnl;
    return { date, value: Math.max(val, 0), pnl };
  });
}

// Generic profile factory for traders without a detailed profile
function makeProfile(
  slug: string,
  name: string,
  handle: string,
  avatar: string,
  pnlRaw: string,
  pnlPercent: number,
  winRate: number,
  totalTrades: number,
  tier: TraderProfile["tier"],
): TraderProfile {
  return {
    slug, name, handle, avatar,
    bio: `Prediction market trader specializing in sports and macro events. Consistent performer with a data-driven approach.`,
    location: "United States",
    joined: "2024",
    followers: Math.floor(Math.random() * 8000 + 500),
    following: Math.floor(Math.random() * 200 + 20),
    totalPnl: pnlRaw,
    totalPnlPercent: pnlPercent,
    winRate,
    totalTrades,
    avgReturn: Math.floor(pnlPercent / totalTrades * 10),
    bestTrade: "Market position",
    bestTradePercent: Math.floor(pnlPercent * 2.5),
    streak: Math.floor(Math.random() * 8 + 1),
    volumeTraded: `$${(Math.random() * 900 + 100).toFixed(0)}K`,
    isVerified: tier === "diamond" || tier === "gold",
    tier,
  };
}

export const TRADER_DATA: Record<string, TraderProfile> = {
  marcusv: {
    slug: "marcusv",
    name: "Marcus Vega",
    handle: "@marcusv",
    avatar: "MV",
    bio: "Full-time prediction market trader. NBA, Fed policy & crypto futures specialist. Ex-quant @ Two Sigma. Sharing my edge, not hiding it.",
    location: "New York, NY",
    joined: "Jan 2024",
    followers: 12400,
    following: 89,
    totalPnl: "+$48,200",
    totalPnlPercent: 312,
    winRate: 78,
    totalTrades: 214,
    avgReturn: 34,
    bestTrade: "Knicks NBA Finals",
    bestTradePercent: 890,
    streak: 11,
    volumeTraded: "$1.2M",
    isVerified: true,
    tier: "diamond",
  },
  priyaseth: {
    slug: "priyaseth",
    name: "Priya Seth",
    handle: "@priyaseth",
    avatar: "PS",
    bio: "Politics & macro trader. Georgetown Law grad. I read the fine print so you don't have to.",
    location: "Washington, D.C.",
    joined: "Mar 2024",
    followers: 9100,
    following: 142,
    totalPnl: "+$31,700",
    totalPnlPercent: 218,
    winRate: 74,
    totalTrades: 178,
    avgReturn: 27,
    bestTrade: "Fed Rate Hold May",
    bestTradePercent: 620,
    streak: 7,
    volumeTraded: "$890K",
    isVerified: true,
    tier: "gold",
  },
  jaker:    makeProfile("jaker",    "Jake R.",    "@jaker",    "JR", "+$27,400", 189, 71, 143, "gold"),
  cleom:    makeProfile("cleom",    "Cleo M.",    "@cleom",    "CM", "+$19,900", 143, 68, 118, "gold"),
  tomw:     makeProfile("tomw",     "Tom W.",     "@tomw",     "TW", "+$14,600",  97, 65,  99, "silver"),
  nikob:    makeProfile("nikob",    "Niko B.",    "@nikob",    "NB", "+$9,300",   61, 63,  84, "silver"),
  emmak:    makeProfile("emmak",    "Emma K.",    "@emmak",    "EK", "+$8,700",   58, 62,  77, "silver"),
  lucast:   makeProfile("lucast",   "Lucas T.",   "@lucast",   "LT", "+$7,900",   54, 61,  71, "silver"),
  sophiag:  makeProfile("sophiag",  "Sophia G.",  "@sophiag",  "SG", "+$7,100",   49, 60,  66, "silver"),
  danh:     makeProfile("danh",     "Daniel H.",  "@danh",     "DH", "+$6,500",   44, 59,  60, "bronze"),
  oliviap:  makeProfile("oliviap",  "Olivia P.",  "@oliviap",  "OP", "+$5,800",   40, 58,  54, "bronze"),
  ryanj:    makeProfile("ryanj",    "Ryan J.",    "@ryanj",    "RJ", "+$5,100",   35, 57,  49, "bronze"),
  miad:     makeProfile("miad",     "Mia D.",     "@miad",     "MD", "+$4,600",   31, 56,  45, "bronze"),
  ethanf:   makeProfile("ethanf",   "Ethan F.",   "@ethanf",   "EF", "+$4,100",   28, 55,  41, "bronze"),
  avac:     makeProfile("avac",     "Ava C.",     "@avac",     "AC", "+$3,800",   25, 54,  38, "bronze"),
  noahz:    makeProfile("noahz",    "Noah Z.",    "@noahz",    "NZ", "+$3,200",   22, 53,  34, "bronze"),
  liamq:    makeProfile("liamq",    "Liam Q.",    "@liamq",    "LQ", "+$2,700",   18, 52,  30, "bronze"),
  saral:    makeProfile("saral",    "Sara L.",    "@saral",    "SL", "-$2,100",  -14, 52,  28, "bronze"),
  kevinm:   makeProfile("kevinm",   "Kevin M.",   "@kevinm",   "KM", "-$3,800",  -21, 49,  25, "bronze"),
  hannahr:  makeProfile("hannahr",  "Hannah R.",  "@hannahr",  "HR", "-$5,400",  -33, 47,  22, "bronze"),
};

export const TRADER_TRADES: TraderTrade[] = [
  { id: 1, market: "Will the Knicks win the 2026 NBA Finals?",        category: "Sports",   side: "YES", entry: 52, exit: 79,   pnl: "+$8,400", pnlPercent: 52,   status: "open",  date: "Jun 1"  },
  { id: 2, market: "Will Fed hold rates in May 2026?",                 category: "Finance",  side: "YES", entry: 34, exit: 91,   pnl: "+$6,100", pnlPercent: 168,  status: "won",   date: "May 28" },
  { id: 3, market: "Will BTC close above $100K on June 15?",           category: "Crypto",   side: "YES", entry: 61, exit: 88,   pnl: "+$3,200", pnlPercent: 44,   status: "won",   date: "May 22" },
  { id: 4, market: "Will Tom Steyer advance from CA primary?",         category: "Politics", side: "NO",  entry: 68, exit: 11,   pnl: "+$4,700", pnlPercent: 84,   status: "won",   date: "May 18" },
  { id: 5, market: "Will Nvidia hit $200 by Q3 2026?",                 category: "Finance",  side: "YES", entry: 44, exit: null, pnl: "-$900",   pnlPercent: -18,  status: "open",  date: "May 14" },
  { id: 6, market: "SpaceX Starship orbital flight before July 2026?", category: "Tech",     side: "YES", entry: 71, exit: 38,   pnl: "-$2,100", pnlPercent: -46,  status: "lost",  date: "May 9"  },
  { id: 7, market: "Will the Lakers reach the 2026 playoffs?",         category: "Sports",   side: "NO",  entry: 29, exit: 8,    pnl: "+$5,600", pnlPercent: 72,   status: "won",   date: "Apr 30" },
  { id: 8, market: "Will ECB cut rates in June 2026?",                 category: "Finance",  side: "YES", entry: 55, exit: 92,   pnl: "+$2,800", pnlPercent: 67,   status: "won",   date: "Apr 24" },
];

export const EARNINGS_DATA: EarningsPoint[] = [
  { date: "Jan", value: 4200,  pnl: 4200  },
  { date: "Feb", value: 9800,  pnl: 5600  },
  { date: "Mar", value: 8100,  pnl: -1700 },
  { date: "Apr", value: 14600, pnl: 6500  },
  { date: "May", value: 21300, pnl: 6700  },
  { date: "Jun", value: 18900, pnl: -2400 },
  { date: "Jul", value: 27400, pnl: 8500  },
  { date: "Aug", value: 33100, pnl: 5700  },
  { date: "Sep", value: 29800, pnl: -3300 },
  { date: "Oct", value: 38200, pnl: 8400  },
  { date: "Nov", value: 43700, pnl: 5500  },
  { date: "Dec", value: 48200, pnl: 4500  },
];

export const SUGGESTED_TRADERS: SuggestedTrader[] = [
  { slug: "jaker",     name: "Jake R.",   handle: "@jaker",     avatar: "JR", avatarGrad: "linear-gradient(135deg,#f59e0b,#ef4444)", pnl: "+$27,400", winRate: 71, isUp: true },
  { slug: "cleom",     name: "Cleo M.",   handle: "@cleom",     avatar: "CM", avatarGrad: "linear-gradient(135deg,#10b981,#059669)", pnl: "+$19,900", winRate: 68, isUp: true },
  { slug: "tomw",      name: "Tom W.",    handle: "@tomw",      avatar: "TW", avatarGrad: "linear-gradient(135deg,#ec4899,#f43f5e)", pnl: "+$14,600", winRate: 65, isUp: true },
  { slug: "nikob",     name: "Niko B.",   handle: "@nikob",     avatar: "NB", avatarGrad: "linear-gradient(135deg,#14b8a6,#0ea5e9)", pnl: "+$9,300",  winRate: 63, isUp: true },
  { slug: "priyaseth", name: "Priya S.",  handle: "@priyaseth", avatar: "PS", avatarGrad: "linear-gradient(135deg,#0ea5e9,#06b6d4)", pnl: "+$31,700", winRate: 74, isUp: true },
  { slug: "marcusv",   name: "Marcus V.", handle: "@marcusv",   avatar: "MV", avatarGrad: "linear-gradient(135deg,#6366f1,#8b5cf6)", pnl: "+$48,200", winRate: 78, isUp: true },
];

// Re-export types so consumers can import from one place
export type { TraderProfile, TraderTrade, EarningsPoint, SuggestedTrader };