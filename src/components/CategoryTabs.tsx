"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import MoreDropdown from "./MoreDropdown";

// ─── Sort tabs ───────────────────────────────────────────────────────────────
// "Breaking" has no true API sort; it sends sort=volume to the backend.
// We store sort=breaking in the URL so it has its own distinct active state.

const SORT_TABS: { label: string; sortParam: string; icon?: boolean }[] = [
  { label: "Trending", sortParam: "volume", icon: true },
  { label: "Breaking", sortParam: "breaking" },
  { label: "New",      sortParam: "newest"  },
];

// ─── Category tabs ───────────────────────────────────────────────────────────
// Only categories that have live markets in the DB. "All" clears the filter.

const CATEGORY_TABS = ["All", "Live Crypto", "Politics", "Sports", "Crypto", "Elections", "Culture", "Tech", "AI"];

// ─── Icons ───────────────────────────────────────────────────────────────────

function TrendingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <polyline points="2,14 7,8 11,11 18,4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14,4 18,4 18,8" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryTabs() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();

  const currentSort     = searchParams.get("sort")     ?? "";
  const currentCategory = searchParams.get("category") ?? "";

  // When we're on a /category/<X> page, the active category comes from the path.
  const pathCategory = pathname?.startsWith("/category/")
    ? decodeURIComponent(pathname.slice("/category/".length))
    : "";
  const activeCategory = pathCategory || currentCategory;

  /** Sort change (still drives the home feed). */
  const selectSort = (sortParam: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortParam === "volume") params.delete("sort");
    else params.set("sort", sortParam);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  };

  /** Category change → dedicated category page (All → home). */
  const selectCategory = (cat: string) => {
    if (cat === "All") {
      router.push("/");
      return;
    }
    router.push(`/category/${encodeURIComponent(cat)}`);
  };

  const isSortActive = (sortParam: string): boolean => {
    if (sortParam === "volume") return !currentSort || currentSort === "volume";
    return currentSort === sortParam;
  };

  const isCategoryActive = (cat: string): boolean => {
    if (cat === "All") return !activeCategory;
    return activeCategory === cat;
  };

  const tabCls = (active: boolean) =>
    `cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 ${
      active ? "border-white text-white" : "border-transparent text-gray-400 hover:text-gray-200"
    }`;

  return (
    <nav className="border-b border-[#1e1f23] px-4">
      <div className="overflow-x-auto scrollbar-none">
        <ul className="flex items-center gap-0">

          {/* Sort tabs */}
          {SORT_TABS.map(({ label, sortParam, icon }) => (
            <li key={label}>
              <button onClick={() => selectSort(sortParam)} className={tabCls(isSortActive(sortParam))}>
                {icon && <TrendingIcon />}
                <span className="font-medium">{label}</span>
              </button>
            </li>
          ))}

          <li className="h-4 w-px bg-[#2a2b2f] mx-1" aria-hidden />

          {/* Category tabs */}
          {CATEGORY_TABS.map((cat) => (
            <li key={cat}>
              <button onClick={() => selectCategory(cat)} className={tabCls(isCategoryActive(cat))}>
                {cat === "Live Crypto" && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {cat}
              </button>
            </li>
          ))}

          <MoreDropdown />

        </ul>
      </div>
    </nav>
  );
}
