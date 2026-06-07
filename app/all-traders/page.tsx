import TradersPageClient from "@/src/components/TradesPageClient";
import { TRADER_DATA, SUGGESTED_TRADERS } from "@/src/data/traderData";

export default function TradersPage() {
  const traders = Object.values(TRADER_DATA);
  return <TradersPageClient traders={traders} />;
}
