"use client";

import { useState } from "react";
import Howitworks from "./Howitworks"

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

  return (
    <div
      className={`
        flex items-center gap-2 px-3 h-9 rounded-lg
        bg-[#1a1b1e] border transition-colors duration-150
        ${focused ? "border-[#374151]" : "border-[#2a2b2f]"}
        w-[260px] xl:w-[320px]
      `}
    >
      <SearchIcon />
      <input
        type="text"
        placeholder="Search polymarkets..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="
          bg-transparent text-sm text-gray-300
          placeholder:text-gray-600 outline-none w-full
          font-['DM_Sans',_sans-serif]
        "
      />
      <kbd className="text-[10px] text-gray-600 bg-[#242529] px-1.5 py-0.5 rounded border border-[#2e2f33] font-mono">
        /
      </kbd>
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
            <div className="flex items-center justify-between px-4 h-12 w-[60%] mx-auto">
                
                {/* Logo */}
                <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
                <PolymarketLogo />
                <span className="text-white font-semibold text-[15px] tracking-tight">
                    Polymarket
                </span>
                </a>

                {/* Search */}
                <div className="flex-1 max-w-md hidden sm:flex justify-between">
                    <SearchBar />
                    <button 
                    onClick={() => setHowItWorksOpen(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-blue-400 hover:text-blue-200 hover:bg-blue-500/10 active:scale-[0.98] transition-all duration-150 cursor-pointer">
                        <InfoIcon className="w-4 h-4" />
                        <span className="font-medium">How it works</span>
                    </button>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0">

                <button className="hidden sm:block px-3 py-1.5 text-[13px] text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e]">
                    Log In
                </button>

                <button className="px-3 py-1.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg">
                    Sign Up
                </button>

                <button className="p-1.5 rounded-lg hover:bg-[#1a1b1e] transition-colors text-gray-400">
                    <HamburgerIcon />
                </button>
                </div>

            </div>

            {/* CATEGORY TABS - SEPARATE ROW */}
            <div className="w-[60%] mx-auto">
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
