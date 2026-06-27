import { Suspense } from "react";
import HeroSection from "@/src/components/Herosection";
import FeaturedSmallMarkets from "@/src/components/Featuredsmallmarkets";
import HomeSidebar from "@/src/components/HomeSidebar";

import { API_BASE } from "@/src/config/api";

interface ApiMarket {
  slug: string;
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

interface ApiCategory {
  tag: string;
  volume: number;
  marketCount: number;
}

// Vercel deploy

export default async function Home() {

  return (
    <main>
      <HeroSection />
      <div className="md:w-[60%] mx-auto my-10 flex justify-between gap-6">
        <div className="w-[70%] mx-auto md:mx-0">
          <Suspense fallback={null}>
            <FeaturedSmallMarkets />
          </Suspense>
        </div>
        <div className="w-[30%] hidden md:block">
          <HomeSidebar/>
        </div>
      </div>
    </main>
  );
}
