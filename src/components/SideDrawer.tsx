"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@/src/providers/AuthProvider";


// ─── Types ────────────────────────────────────────────────────────────────────

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: "login" | "signup") => void;
}


// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    heading: "Markets",
    links: [
      { label: "Trending",    href: "/trending",    icon: TrendingIcon    },
      { label: "Politics",    href: "/politics",    icon: PoliticsIcon    },
      { label: "Sports",      href: "/sports",      icon: SportsIcon      },
      { label: "Crypto",      href: "/crypto",      icon: CryptoIcon      },
      { label: "Geopolitics", href: "/geopolitics", icon: GlobeIcon       },
      { label: "Tech",        href: "/tech",        icon: TechIcon        },
      { label: "Finance",     href: "/finance",     icon: FinanceIcon     },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Profile",     href: "/profile",     icon: ProfileIcon     },
      { label: "Portfolio",   href: "/portfolio",   icon: PortfolioIcon   },
      { label: "Activity",    href: "/activity",    icon: ActivityIcon    },
      { label: "Leaderboard", href: "/leaderboard", icon: LeaderboardIcon },
      { label: "Referrals",   href: "/referrals",   icon: ReferralIcon    },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "How it works", href: "/how-it-works", icon: InfoIcon  },
      { label: "FAQ",          href: "/faq",          icon: FaqIcon   },
      { label: "Blog",         href: "/blog",         icon: BlogIcon  },
      { label: "Terms",        href: "/terms",        icon: TermsIcon },
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrendingIcon()    { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polyline points="2,14 7,8 11,11 18,4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14,4 18,4 18,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function PoliticsIcon()    { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="11" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="8" y="7" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="3" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.7"/></svg>; }
function SportsIcon()      { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7"/><path d="M10 2.5C10 2.5 7 6 7 10s3 7.5 3 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M2.5 10h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function CryptoIcon()      { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7"/><path d="M8 7h3.5a1.5 1.5 0 0 1 0 3H8m0 0h4a1.5 1.5 0 0 1 0 3H8m0-6v6m1.5-7.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function GlobeIcon()       { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7"/><path d="M10 2.5C10 2.5 7 6 7 10s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function TechIcon()        { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><path d="M6.5 17.5h7M10 14v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function FinanceIcon()     { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 13l4-4 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 17h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function ProfileIcon()     { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 17.5a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function PortfolioIcon()   { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="6.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><path d="M7 6.5V5a3 3 0 0 1 6 0v1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function ActivityIcon()    { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><polyline points="2,10 5,10 7,4 9,16 11,8 13,12 15,10 18,10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LeaderboardIcon() { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 3l1.8 3.6 4 .6-2.9 2.8.7 4L10 12l-3.6 1.9.7-4L4.2 7.2l4-.6L10 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function ReferralIcon()    { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M2 17.5a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M15 7h3m-1.5-1.5L18 7l-1.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function InfoIcon()        { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7"/><path d="M10 9v5M10 7h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function FaqIcon()         { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7"/><path d="M8 8a2 2 0 1 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="10" cy="14.5" r=".6" fill="currentColor"/></svg>; }
function BlogIcon()        { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 5h12M4 9h8M4 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function TermsIcon()       { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3.5" y="2" width="13" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><path d="M7 7h6M7 10.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function CloseIcon()       { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function LogoutIcon()      { return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M7.5 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M13 7l4 3-4 3M17 10H7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SettingsIcon()    { return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.22 4.22l1.41 1.41m8.74 8.74 1.41 1.41M4.22 15.78l1.41-1.41m8.74-8.74 1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }

// Initials


  function getInitials(name?: string | null) {
    if (!name) return "?";

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  }


// ─── Component ────────────────────────────────────────────────────────────────


export default function SideDrawer({ isOpen, onClose, onOpenAuth }: SideDrawerProps) {
  const {
    authenticated,
    logout,
    user: privyUser,
  } = usePrivy();

  const {
    user: userDb,
    authenticated: authenticatedDb,
  } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${sw}px`;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAuthClick = (mode: "login" | "signup") => {
    onClose();
    // Small delay so drawer closes before modal opens
    setTimeout(() => onOpenAuth(mode), 180);
  };


  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[998] transition-all duration-300 ${isOpen ? "bg-black/60 backdrop-blur-[2px] pointer-events-auto" : "bg-transparent pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 z-[999] h-full w-[320px] max-w-[90vw] bg-[#0e0f11] border-l border-white/[0.07] flex flex-col transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-x-0" : "translate-x-full"} shadow-[-24px_0_80px_rgba(0,0,0,0.7)] font-['DM_Sans',_sans-serif] select-none`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <span className="text-[11px] uppercase tracking-[0.12em] text-gray-500 font-medium">Menu</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95">
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-6 px-4 space-y-1">

          {/* USER CARD — logged in */}
          {authenticated ? (
            <div className="mb-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/[0.07] via-transparent to-transparent pointer-events-none rounded-2xl" />
              <div className="flex items-center gap-3 relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#059669] flex items-center justify-center text-[13px] font-bold text-black shrink-0">
                  {getInitials(userDb?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{userDb?.name}</p>
                  <p className="text-[12px] text-gray-500">{userDb?.handle}</p>
                </div>
                <button className="w-8 h-8 rounded-xl hover:bg-white/[0.08] flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all">
                  <SettingsIcon />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between relative">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">Balance</p>
                  <p className="text-[18px] font-bold text-white mt-0.5 tabular-nums">{userDb?.balance}$</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">P&L</p>
                  <p className={`text-[14px] font-semibold mt-0.5 tabular-nums ${userDb?.pnlPositive ? "text-[#60a5fa]" : "text-red-400"}`}>{userDb?.pnl}</p>
                </div>
              </div>
              <button className="mt-3 w-full py-2 rounded-xl bg-[#60a5fa] hover:bg-[#2563eb] active:scale-[0.98] text-black text-[13px] font-semibold transition-all duration-150 cursor-pointer">
                Deposit funds
              </button>
            </div>
          ) : (
            /* GUEST CTA */
            <div className="mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/[0.05] via-transparent to-transparent pointer-events-none rounded-2xl" />
              <p className="text-[15px] font-semibold text-white relative">Start predicting</p>
              <p className="text-[12px] text-gray-400 mt-1 leading-relaxed relative">Trade on real-world events. No commissions.</p>
              <div className="mt-4 flex gap-2 relative">
                <button
                  onClick={() => handleAuthClick("signup")}
                  className="flex-1 py-2.5 rounded-xl bg-[#60a5fa] hover:bg-[#2563eb] active:scale-[0.98] text-black text-[13px] font-semibold transition-all duration-150 cursor-pointer"
                >
                  Sign up free
                </button>
                <button
                  onClick={() => handleAuthClick("login")}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.1] active:scale-[0.98] text-white text-[13px] font-medium transition-all duration-150 cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {/* NAV SECTIONS */}
          {NAV_SECTIONS.map((section) => {
            if (section.heading === "Account" && !authenticated) return null;
            return (
              <div key={section.heading} className="mb-1">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600 font-medium px-3 pt-3 pb-1.5">{section.heading}</p>
                <ul className="space-y-0.5">
                  {section.links.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <a
                        href={href}
                        onClick={onClose}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-100 cursor-pointer"
                      >
                        <span className="text-gray-500 group-hover:text-[#60a5fa] transition-colors duration-100">
                          <Icon />
                        </span>
                        <span className="text-[14px] font-medium">{label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-4">
          {authenticated ? (
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/[0.07] transition-all duration-150 cursor-pointer group"
            >
              <LogoutIcon />
              <span className="text-[13px] font-medium">Sign out</span>
            </button>
          ) : (
            <p className="text-[11px] text-gray-600 text-center">
              By signing up you agree to our{" "}
              <a href="/terms" className="text-gray-500 hover:text-gray-300 underline underline-offset-2">Terms of Use</a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
