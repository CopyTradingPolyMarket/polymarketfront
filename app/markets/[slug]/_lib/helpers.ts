import { formatVolume } from "@/src/utils/formatters";
import type { ApiMarketDetail, MappedMarket } from "@/app/markets/[slug]/_lib/types";

export function isConditionId(s: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(s);
}

export function mapMarket(api: ApiMarketDetail): MappedMarket {
  return {
    id:      api.id,
    title:   api.title,
    image:   api.image ?? "",
    volume:  formatVolume(api.volume, { suffix: " vol" }),
    options: api.options,
    slug: api.slug,
    resolved: api.resolved,
    isLiveCrypto: api.isLiveCrypto ?? false,
    spot: api.spot ?? null,
    eventId: api.eventId,
    line: api.line ?? null,
  };
}
