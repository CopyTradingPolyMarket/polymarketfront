"use client";

import { useState } from "react";
import MoreDropdown from "./MoreDropdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  label: string;
  href: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { label: "Politics", href: "/politics" },
  { label: "Sports", href: "/sports" },
  { label: "Crypto", href: "/crypto" },
  { label: "Esports", href: "/esports" },
  { label: "Iran", href: "/iran" },
  { label: "Finance", href: "/finance" },
  { label: "Geopolitics", href: "/geopolitics" },
  { label: "Tech", href: "/tech" },
  { label: "Culture", href: "/culture" },
  { label: "Economy", href: "/economy" },
  { label: "Weather", href: "/weather" },
  { label: "Mentions", href: "/mentions" },
  { label: "Elections", href: "/elections" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

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
  const [active, setActive] = useState<string>("Trending");

  return (
    <nav className="border-b border-[#1e1f23] px-4">
      {/* overflow-x scroll wrapper — must NOT be on the ul itself or it clips the MoreDropdown */}
      <div className="overflow-x-auto scrollbar-none">
      <ul className="flex items-center gap-0">

        {/* Trending */}
        <li>
          <button
            onClick={() => setActive("Trending")}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 ${
              active === "Trending" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <TrendingIcon />
            <span className="font-medium">Trending</span>
          </button>
        </li>

        {/* Breaking */}
        <li>
          <button
            onClick={() => setActive("Breaking")}
            className={`cursor-pointer px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 ${
              active === "Breaking" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Breaking
          </button>
        </li>

        <li className="h-4 w-px bg-[#2a2b2f] mx-1" aria-hidden />

        {/* New */}
        <li>
          <button
            onClick={() => setActive("New")}
            className={`cursor-pointer px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 ${
              active === "New" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            New
          </button>
        </li>

        <li className="h-4 w-px bg-[#2a2b2f] mx-1" aria-hidden />

        {/* Dynamic categories */}
        {CATEGORIES.map((cat) => (
          <li key={cat.label}>
            <button
              onClick={() => setActive(cat.label)}
              className={`px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 cursor-pointer ${
                active === cat.label ? "border-white text-white" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {cat.label}
            </button>
          </li>
        ))}

        {/* More — hover dropdown */}
        <MoreDropdown />

      </ul>
      </div>
    </nav>
  );
}
