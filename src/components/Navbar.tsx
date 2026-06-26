"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Howitworks from "./Howitworks";
import SideDrawer from "./SideDrawer";
import AuthModal from "./AuthModal";
import CategoryTabs from "./CategoryTabs";
import Image from "next/image";
import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PolymarketLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
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
      <path d="M13.5 13.5L18 18" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9v5M10 7h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface SearchResult {
  id: string;
  title: string;
  image: string | null;
  volume: number;
  options: { label: string; probability: number }[];
  slug: string;
}

function formatVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M vol`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K vol`;
  return `$${v.toFixed(0)} vol`;
}

function SearchBar() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [focused,  setFocused]  = useState(false);
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      const q = query.trim();
      const params = new URLSearchParams({ limit: "6", sort: "volume" });
      if (q) params.set("search", q);

      setLoading(true);
      fetch(`${API_BASE}/api/markets?${params}`, { signal })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data: { items: SearchResult[] }) => {
          if (!cancelled) setResults(data.items);
        })
        .catch((err) => {
          if (!cancelled && err.name !== "AbortError") setResults([]);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", query.trim());
      params.delete("page");
      router.push(`/?${params.toString()}`);
      setFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={`relative z-50 transition-all duration-300 ease-out ${focused ? "w-[520px]" : "w-[320px]"}`}>
      <div className={`flex items-center gap-3 h-11 px-4 rounded-2xl transition-all duration-300 ${
        focused
          ? "bg-[#151619] border border-[#34d399] shadow-[0_0_0_1px_rgba(99,102,241,.25),0_20px_80px_rgba(0,0,0,.6)]"
          : "bg-[#1a1b1e] border border-[#2a2b2f]"
      }`}>
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search markets..."
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none w-full font-['DM_Sans',_sans-serif]"
        />
        <kbd className="text-[10px] text-gray-600 bg-[#242529] px-2 py-0.5 rounded border border-[#2e2f33] font-mono">/</kbd>
      </div>

      {focused && (
        <div className="absolute top-full mt-3 left-0 w-full z-[9999] rounded-2xl bg-[#121316] backdrop-blur-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,.65)]">
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">
              {query ? "Results" : "Trending Markets"}
            </p>
            <span className="text-[10px] text-gray-600">
              {loading ? "…" : `${results.length} items`}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-gray-600">Loading…</div>
            ) : results.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No markets found</div>
            ) : (
              results.map((market) => {
                const yesOpt =
                  market.options.find((o) => o.label.toLowerCase() === "yes") ??
                  market.options[0];
                return (
                  <Link
                    key={market.id}
                    href={`/markets/${market.slug}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.04] transition-all group border-b border-white/[0.03] last:border-0"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#1a1b1e]">
                      {market.image ? (
                        <Image src={market.image} alt={market.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#242529]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate group-hover:text-indigo-200 transition-colors">
                        {market.title}
                      </p>
                      <span className="text-[11px] text-gray-500 mt-0.5 block">
                        {formatVol(market.volume)}
                      </span>
                    </div>
                    {yesOpt && (
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-bold text-emerald-400">
                          {Math.round(yesOpt.probability)}%
                        </div>
                        <div className="text-[10px] text-gray-500">YES</div>
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [authOpen,       setAuthOpen]       = useState(false);
  const [authMode,       setAuthMode]       = useState<"login" | "signup">("signup");

  const { authenticated, logout } = usePrivy();

  const openLogin  = () => { setAuthMode("login");  setAuthOpen(true); };
  const openSignup = () => { setAuthMode("signup"); setAuthOpen(true); };

  return (
    <>
      <header className="w-full bg-[#0E0E10] sticky top-0 z-50 font-['DM_Sans',_sans-serif]">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-8 h-12 w-full md:w-[60%] mx-auto">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
            <PolymarketLogo />
            <span className="text-white font-semibold text-[15px] tracking-tight">Polymarket</span>
          </a>

          {/* Search + How it works */}
          <div className="flex">
            <div className="flex-1 max-w-md hidden sm:flex justify-between my-5">
              <SearchBar />
            </div>
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-[#34d399] hover:text-[#3ee6aa] active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <InfoIcon className="w-4 h-4" />
              <span className="font-medium">How it works</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {authenticated ? (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-1.5 text-[13px] text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e] hidden sm:block"
                >
                  Profile
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 text-[13px] text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e] cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="px-3 py-1.5 text-[13px] text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#1a1b1e] cursor-pointer hidden sm:block"
                >
                  Log In
                </button>
                <button
                  onClick={openSignup}
                  className="px-3 py-1.5 text-[13px] font-medium text-white bg-[#34d399] hover:bg-[#3ee6aa] transition-colors rounded-lg cursor-pointer hidden sm:block"
                >
                  Sign Up
                </button>
              </>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="p-1.5 rounded-lg hover:bg-[#1a1b1e] transition-colors text-gray-400 hover:text-white cursor-pointer"
            >
              <HamburgerIcon />
            </button>
          </div>

        </div>

        {/* CATEGORY TABS */}
        <div className="w-full md:w-[60%] mx-auto">
          <CategoryTabs />
        </div>

      </header>

      <Howitworks isOpen={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenAuth={(mode) => {
          setDrawerOpen(false);
          setTimeout(() => { setAuthMode(mode); setAuthOpen(true); }, 180);
        }}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}