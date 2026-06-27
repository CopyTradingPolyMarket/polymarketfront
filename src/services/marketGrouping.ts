import { formatLiveCryptoTitle } from "@/lib/liveCryptoTitle";
import type { Market, MarketOption } from "@/src/components/Marketcard";
import { formatVolume as formatVolumeBase } from "@/src/utils/formatters";

// Top-level categories we recognize inside the noisy `tags` array. Reorder /
// extend to match your taxonomy. Exported so other modules share one source.
export const CATEGORIES = [
  "Pro Basketball (M)",
  "Crypto",
  "Soccer",
  "Politics",
  "Sports",
  "Elections",
  "Culture",
  "Tech",
  "AI",
];

export interface ApiMarketOption {
  label: string;
  probability: number; // already 0–100
  conditionId?: string; // per-option conditionId for live /ws/prices subscription
}

export interface ApiMarket {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: ApiMarketOption[];
  tags: string[];
  slug: string;
  eventId: string | null;
}

export function categoryFromTags(tags: string[] | undefined): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  return CATEGORIES.find((known) => tags.includes(known));
}

export function formatVolume(v: number): string {
  return formatVolumeBase(v, { suffix: " vol" });
}

// --- eventId grouping (same logic as the home feed) -------------------------

const EVENT_TEMPLATES: { match: RegExp; eventTitle: (m: RegExpMatchArray) => string }[] = [
  { match: /^Will (.+?) win (.+?)\??$/i, eventTitle: (m) => `${m[2].replace(/^the\s+/i, "")} — Winner` },
];

function extractOptionLabel(title: string): { label: string; eventTitle: string } | null {
  for (const tpl of EVENT_TEMPLATES) {
    const m = title.match(tpl.match);
    if (m) return { label: m[1], eventTitle: tpl.eventTitle(m) };
  }
  return null;
}

// Optional: choose the small caps label shown on the card. Defaults to the
// top-level category; CategoryPage passes a picker that returns a subcategory.
export type PickLabel = (group: ApiMarket[]) => string | undefined;
const defaultPickLabel: PickLabel = (group) => categoryFromTags(group[0].tags);

function mapMarket(api: ApiMarket, label: string | undefined): Market {
  return {
    id: api.id,
    title: (api.slug && formatLiveCryptoTitle(api.slug)) ?? api.title,
    image: api.image ?? "",
    volume: formatVolume(api.volume),
    options: api.options.map((o) => ({
      label: o.label,
      probability: o.probability,
      conditionId: o.conditionId ?? api.id, // fall back to the market's conditionId
      priceSide: o.label.toLowerCase() === "no" ? "no" : "yes",
    })),
    optionsCount: api.options.length,
    categoryLabel: label,
    slug: api.slug,
    eventId: api.eventId ?? "",
  };
}

function buildEventCard(group: ApiMarket[], label: string | undefined): Market | null {
  const parsed = group.map((m) => ({ market: m, info: extractOptionLabel(m.title) }));
  if (parsed.some((p) => !p.info)) return null;

  const eventTitle = parsed[0].info!.eventTitle;
  const options: MarketOption[] = parsed
    .map(({ market, info }) => {
      const yes = market.options.find((o) => o.label.toLowerCase() === "yes") ?? market.options[0];
      return {
        label: info!.label,
        probability: yes?.probability ?? 0,
        image: market.image ?? undefined,
        conditionId: yes?.conditionId ?? market.id, // each option is its own sub-market
        priceSide: "yes" as const,                  // option = that sub-market's "Yes"
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const top = group.reduce((best, m) => (m.volume > best.volume ? m : best), group[0]);

  return {
    id: group[0].eventId ?? group[0].id,
    title: eventTitle,
    image: top.image ?? "",
    volume: formatVolume(group.reduce((sum, m) => sum + m.volume, 0)),
    options,
    optionsCount: group.length,
    categoryLabel: label,
    slug: top.slug,
    eventId: group[0].eventId ?? "",
  };
}

export function groupMarketsByEvent(items: ApiMarket[], pickLabel: PickLabel = defaultPickLabel): Market[] {
  const groups = new Map<string, ApiMarket[]>();
  items.forEach((item) => {
    const key = item.eventId ?? `solo:${item.id}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });

  const withVolume: { market: Market; volume: number }[] = [];

  groups.forEach((group) => {
    const label = pickLabel(group);
    if (group.length === 1) {
      withVolume.push({ market: mapMarket(group[0], label), volume: group[0].volume });
      return;
    }
    const eventCard = buildEventCard(group, label);
    if (eventCard) {
      withVolume.push({ market: eventCard, volume: group.reduce((s, m) => s + m.volume, 0) });
    } else {
      group.forEach((m) => withVolume.push({ market: mapMarket(m, label), volume: m.volume }));
    }
  });

  return withVolume.sort((a, b) => b.volume - a.volume).map((w) => w.market);
}
