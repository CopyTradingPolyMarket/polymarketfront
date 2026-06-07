import { notFound } from "next/navigation";
import TraderProfileClient from "@/src/components/TraderProfileClient";
import SuggestedTradersSidebar from "@/src/components/SuggestedTradersSidebar";
import {
  TRADER_DATA,
  TRADER_TRADES,
  EARNINGS_DATA,
  SUGGESTED_TRADERS,
} from "@/src/data/traderData";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TraderProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = TRADER_DATA[slug];

  if (!profile) notFound();

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-4 flex gap-6">
        <div className="flex-1 min-w-0">
          <TraderProfileClient
            profile={profile}
            trades={TRADER_TRADES}
            earnings={EARNINGS_DATA}
          />
        </div>
        <div className="hidden lg:block pt-6">
          <SuggestedTradersSidebar
            traders={SUGGESTED_TRADERS}
            currentSlug={slug}
          />
        </div>
      </div>
    </div>
  );
}