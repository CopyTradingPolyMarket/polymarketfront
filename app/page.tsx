import Image from "next/image";
import HeroSection from "@/src/components/Herosection";
import FeaturedSmallMarkets from "@/src/components/Featuredsmallmarkets"

export default function Home() {
    return (
        <main className="">
          <HeroSection/>
          <div className="w-[60%] mx-auto my-10">
            <FeaturedSmallMarkets/>
          </div>
        </main>
    );
}
