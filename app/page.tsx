import HeroSection from "@/src/components/Herosection";
import FeaturedSmallMarkets from "@/src/components/Featuredsmallmarkets";
import HomeSidebar from "@/src/components/HomeSidebar";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <div className="w-[60%] mx-auto my-10 flex justify-between gap-6">
        <div className="w-[75%]">
          <FeaturedSmallMarkets />
        </div>
        <div className="w-[25%]">
          <HomeSidebar />
        </div>
      </div>
    </main>
  );
}
