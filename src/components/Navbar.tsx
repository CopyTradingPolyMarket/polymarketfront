"use client";

import { useState, useMemo } from "react";
import Howitworks from "./Howitworks"
import { MOCK_MARKETS } from "@/lib/markets";
import { slugify } from "@/lib/slugify";
import Image from "next/image";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  label: string;
  href: string;
}

// ─── Static categories (replace with dynamic fetch later) ────────────────────

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

// ─── Icons ───────────────────────────────────────────────────────────────────

function PolymarketLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white"
    >
      <path
        d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="#6b7280" strokeWidth="1.8" />
      <path
        d="M13.5 13.5L18 18"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <polyline
        points="2,14 7,8 11,11 18,4"
        stroke="#9ca3af"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14,4 18,4 18,8"
        stroke="#9ca3af"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type IconProps = {
  className?: string;
};

function InfoIcon({ className }: IconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10 9v5M10 7h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="#9ca3af"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 6l4 4 4-4"
        stroke="#9ca3af"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SearchBar() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) {
      return MOCK_MARKETS.slice(0, 5);
    }

    return MOCK_MARKETS.filter((market) =>
      market.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
  }, [query]);

  return (
    <div
      className={`
        relative z-50 transition-all duration-300 ease-out
        ${focused ? "w-[520px]" : "w-[320px]"}
      `}
    >
      {/* INPUT */}
      <div
        className={`
          flex items-center gap-3 h-11 px-4 rounded-2xl
          transition-all duration-300

          ${
            focused
              ? "bg-[#151619] border border-[#34d399] shadow-[0_0_0_1px_rgba(99,102,241,.25),0_20px_80px_rgba(0,0,0,.6)]"
              : "bg-[#1a1b1e] border border-[#2a2b2f]"
          }
        `}
      >
        <SearchIcon />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets..."
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="
            bg-transparent text-sm text-gray-200
            placeholder:text-gray-600 outline-none w-full
            font-['DM_Sans',_sans-serif]
          "
        />

        <kbd className="text-[10px] text-gray-600 bg-[#242529] px-2 py-0.5 rounded border border-[#2e2f33] font-mono">
          /
        </kbd>
      </div>

      {/* DROPDOWN */}
      {focused && (
        <div
          className="
            absolute top-full mt-3 left-0 w-full
            z-[9999]
            rounded-2xl
            bg-[#121316]
            backdrop-blur-xl
            overflow-hidden
            shadow-[0_30px_100px_rgba(0,0,0,.65)]
          "
        >
          {/* HEADER */}
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">
              {query ? "Results" : "Trending Markets"}
            </p>

            <span className="text-[10px] text-gray-600">
              {results.length} items
            </span>
          </div>

          {/* LIST */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {results.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${slugify(market.title)}`}
                className="
                  flex items-center gap-4 px-4 py-3
                  hover:bg-white/[0.04]
                  transition-all group
                  border-b border-white/[0.03]
                  last:border-0
                "
              >
                {/* IMAGE */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={market.image}
                    alt={market.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* MAIN */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate group-hover:text-indigo-200 transition-colors">
                    {market.title}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-500">
                      {market.volume}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-400">
                      Crypto
                    </span>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-bold text-emerald-400">
                    {market.options[0].probability}%
                  </div>
                  <div className="text-[10px] text-gray-500">YES</div>
                </div>
              </Link>
            ))}

            {results.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">
                No markets found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTabs() {
  const [active, setActive] = useState<string>("Trending");
  const VISIBLE_COUNT = 15; // show fewer on smaller screens dynamically via JS
  const visible = CATEGORIES.slice(0, VISIBLE_COUNT);

  return (
    <nav className="border-b border-[#1e1f23] px-4">
      <ul className="flex items-center gap-0 overflow-x-auto scrollbar-none">
        {/* Trending pill */}
        <li>
          <button
            onClick={() => setActive("Trending")}
            className={`
              cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap
              transition-colors duration-150 border-b-2
              ${
                active === "Trending"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }
            `}
          >
            <TrendingIcon />
            <span className="font-medium">Trending</span>
          </button>
        </li>

        {/* Breaking — special accent */}
        <li>
          <button
            onClick={() => setActive("Breaking")}
            className={`
              cursor-pointer px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2
              ${
                active === "Breaking"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }
            `}
          >
            Breaking
          </button>
        </li>

        {/* Divider */}
        <li className="h-4 w-px bg-[#2a2b2f] mx-1" aria-hidden />

        {/* New */}
        <li>
          <button
            onClick={() => setActive("New")}
            className={`
              cursor-pointer px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2
              ${
                active === "New"
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }
            `}
          >
            New
          </button>
        </li>

        {/* Divider */}
        <li className="h-4 w-px bg-[#2a2b2f] mx-1" aria-hidden />

        {/* Dynamic categories */}
        {visible.map((cat) => (
          <li key={cat.label}>
            <button
              onClick={() => setActive(cat.label)}
              className={`
                px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 border-b-2 cursor-pointer
                ${
                  active === cat.label
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }
              `}
            >
              {cat.label}
            </button>
          </li>
        ))}

        {/* More dropdown placeholder */}
        <li>
          <button className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap border-b-2 border-transparent">
            More
            <ChevronDownIcon />
          </button>
        </li>
      </ul>
    </nav>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export default function Navbar() {

    const [howItWorksOpen, setHowItWorksOpen] = useState(false);

    return (
        <>
        <header className="w-full bg-[#111113] sticky top-0 z-50 font-['DM_Sans',_sans-serif]">

            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 py-8 h-12 w-full md:w-[60%] mx-auto">
                
                {/* Logo */}
                <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
                <PolymarketLogo />
                <span className="text-white font-semibold text-[15px] tracking-tight">
                    Polymarket
                </span>
                </a>

                {/* Search */}
                <div className="flex">
                  <div className="flex-1 max-w-md hidden sm:flex justify-between my-5">
                      <SearchBar />
                  </div>
                  <button 
                    onClick={() => setHowItWorksOpen(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-[#34d399] hover:text-[#3ee6aa] active:scale-[0.98] transition-all duration-150 cursor-pointer">
                        <InfoIcon className="w-4 h-4" />
                        <span className="font-medium">How it works</span>
                  </button>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0">

                <button className="px-3 py-1.5 text-[13px] text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e] cursor-pointer">
                    Log In
                </button>

                <button className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#34d399] hover:bg-[#3ee6aa] transition-colors rounded-lg cursor-pointer">
                    Sign Up
                </button>

                <button className="p-1.5 rounded-lg hover:bg-[#1a1b1e] transition-colors text-gray-400">
                    <HamburgerIcon />
                </button>
                </div>

            </div>

            {/* CATEGORY TABS - SEPARATE ROW */}
            <div className="w-full md:w-[60%] mx-auto">
                <CategoryTabs />
            </div>

        </header>
        <Howitworks
            isOpen={howItWorksOpen}
            onClose={() => setHowItWorksOpen(false)}
        />
        </>
    );
}
