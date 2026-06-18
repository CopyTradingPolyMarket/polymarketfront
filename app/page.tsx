import HeroSection from "@/src/components/Herosection";
import FeaturedSmallMarkets from "@/src/components/Featuredsmallmarkets";
import HomeSidebar from "@/src/components/HomeSidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ApiMarket {
  title: string;
  volume: number;
  options: { label: string; probability: number }[];
  tags: string[];
}

interface ApiEvent {
  title: string;
  tags: string[];
  markets: { volume: number }[];
}

// Vercel deploy

export default async function Home() {
  const [marketsRes, eventsRes] = await Promise.all([
    fetch(`${API_BASE}/api/markets?sort=volume&limit=6&includeResolved=false`, { cache: "no-store" }),
    fetch(`${API_BASE}/api/events?limit=3`, { cache: "no-store" }),
  ]);

  const markets: ApiMarket[] = marketsRes.ok
    ? ((await marketsRes.json()) as { items: ApiMarket[] }).items
    : [];
  const events: ApiEvent[] = eventsRes.ok
    ? ((await eventsRes.json()) as { items: ApiEvent[] }).items
    : [];

  return (
    <main>
      <HeroSection />
      <div className="md:w-[60%] mx-auto my-10 flex justify-between gap-6">
        <div className="w-[75%] mx-auto md:mx-0">
          <FeaturedSmallMarkets />
        </div>
        <div className="w-[25%] hidden md:block">
          <HomeSidebar markets={markets} events={events} />
        </div>
      </div>
    </main>
  );
}
