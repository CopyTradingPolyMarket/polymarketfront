"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// ─── Items ────────────────────────────────────────────────────────────────────

const MORE_ITEMS = [
  {
    heading: "Traders",
    links: [
      { label: "All Traders", href: "/all-traders", description: "Browse every active trader", icon: AllTradersIcon },
      { label: "Leaderboard", href: "/leaderboard", description: "Top performers this week", icon: LeaderboardIcon },
      { label: "Liquidity Providers", href: "/liquidity-providers", description: "Market makers & LPs", icon: LiquidityIcon },
    ],
  },
  {
    heading: "Markets",
    links: [
      { label: "By Volume", href: "/markets/volume", description: "Highest traded markets", icon: VolumeIcon },
      { label: "Resolved", href: "/markets/resolved", description: "Settled & closed markets", icon: ResolvedIcon },
      { label: "New Markets", href: "/markets/new", description: "Recently created", icon: NewIcon },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Docs", href: "/docs/api", description: "REST & WebSocket reference", icon: ApiIcon },
      { label: "Newsletter", href: "/newsletter", description: "Weekly market digest", icon: NewsletterIcon },
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function AllTradersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 17a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 17a3.5 3.5 0 0 0-3-3.46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LeaderboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 3l1.8 3.6 4 .6-2.9 2.8.7 4L10 12l-3.6 1.9.7-4L4.2 7.2l4-.6L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function LiquidityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v14M6 6l4-3 4 3M6 14l4 3 4-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="11" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="8.5" y="7" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function ResolvedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ApiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M6 7l-3 3 3 3M14 7l3 3-3 3M11 5l-2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NewsletterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 7.5l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom - 4, // overlap 4px da nema gap između triggera i panela
      right: window.innerWidth - rect.right,
    });
  };

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    updatePos();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const dropdownContent = (
    <div
      onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
      onMouseLeave={handleMouseLeave}
      style={{ top: dropdownPos.top, right: dropdownPos.right }}
      className={`
        fixed z-[9999] pt-1
        transition-all duration-200 origin-top-right
        ${open
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none"
        }
      `}
    >
      <div className="bg-[#111315] border border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden w-[480px]">

        <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
          <p className="text-[11px] uppercase tracking-[0.12em] text-gray-600 font-medium">
            More pages
          </p>
        </div>

        <div className="p-3 grid grid-cols-3 gap-1">
          {MORE_ITEMS.map((section) => (
            <div key={section.heading}>
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600 font-medium px-2 pt-2 pb-1.5">
                {section.heading}
              </p>
              <ul className="space-y-0.5">
                {section.links.map(({ label, href, description, icon: Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="group flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-100"
                    >
                      <span className="mt-0.5 text-gray-500 group-hover:text-[#34d399] transition-colors shrink-0">
                        <Icon />
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors leading-none">
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-1 leading-tight">
                          {description}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between">
          <p className="text-[11px] text-gray-600">Can't find what you're looking for?</p>
          <Link
            href="/help"
            onClick={() => setOpen(false)}
            className="text-[11px] text-[#34d399] hover:text-[#3ee6aa] transition-colors font-medium"
          >
            Visit Help Center →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <li
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 px-3 py-2.5 text-sm transition-colors whitespace-nowrap border-b-2 cursor-pointer ${
          open ? "text-white border-white" : "text-gray-400 hover:text-gray-200 border-transparent"
        }`}
      >
        More
        <ChevronDownIcon open={open} />
      </button>

      {mounted && createPortal(dropdownContent, document.body)}
    </li>
  );
}
