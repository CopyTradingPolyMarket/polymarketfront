"use client";

import TrendingSections, {
  type RankedSection,
  marketsToRankedRows,
} from "./TrendingSections";
import { useCategoriesMarkets } from "@/src/services/useCategoryMarkets";

// Each sidebar entry is a category rendered as a compact ranked list. Reorder /
// extend freely; `category` must match a tag your API actually filters on, and
// `href` is where the section's › arrow navigates.
const SIDEBAR_SECTIONS = [
  { id: "elections", title: "Elections", category: "Elections", href: "/category/Elections" },
  { id: "politics",  title: "Politics",  category: "Politics",  href: "/category/Politics" },
  { id: "sports",    title: "Sports",    category: "Sports",    href: "/category/Sports" },
  { id: "crypto",    title: "Crypto",    category: "Crypto",    href: "/category/Crypto" },
] as const;

const ROWS_PER_SECTION = 3;

export default function HomeSidebar() {
  const categories = SIDEBAR_SECTIONS.map((s) => s.category);
  const { data, loading } = useCategoriesMarkets(categories, "volume");

  const sections: RankedSection[] = !data
    ? []
    : SIDEBAR_SECTIONS
        .map((s) => ({
          id: s.id,
          title: s.title,
          href: s.href,
          markets: marketsToRankedRows(data[s.category] ?? [], ROWS_PER_SECTION),
        }))
        .filter((s) => s.markets.length > 0);

  return (
    <aside className="w-full">
      <TrendingSections
        sections={sections}
        rowsPerSection={ROWS_PER_SECTION}
        loading={loading}
        skeletonSections={SIDEBAR_SECTIONS.length}
      />
    </aside>
  );
}
