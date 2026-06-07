import HeroSection from "@/src/components/Herosection";
import FeaturedSmallMarkets from "@/src/components/Featuredsmallmarkets";
import HomeSidebar from "@/src/components/HomeSidebar";

// Vercel deploy

export default function Home() {
  return (
    <main>
      <HeroSection />
      <div className="md:w-[60%] mx-auto my-10 flex justify-between gap-6">
        <div className="w-[75%] mx-auto md:mx-0">
          <FeaturedSmallMarkets />
        </div>
        <div className="w-[25%] hidden md:block">
          <HomeSidebar />
        </div>
      </div>
    </main>
  );
}
