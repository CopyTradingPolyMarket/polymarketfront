"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Config (edit freely) ─────────────────────────────────────────────────────

const PROMO = {
  title: "Intro to Perpetuals",
  description: "Trade with leverage, go long or short, and keep your position open without an expiration date.",
  ctaLabel: "Get started",
  href: "/learn/perpetuals",
};

type Accent = "blue" | "red" | "green" | "purple" | "orange";

const ACCENT: Record<Accent, { glow: string; border: string; chevron: string; iconBg: string }> = {
  blue:   { glow: "rgba(56,189,248,0.16)",  border: "rgba(56,189,248,0.35)",  chevron: "#38bdf8", iconBg: "rgba(56,189,248,0.12)"  },
  red:    { glow: "rgba(248,113,113,0.16)", border: "rgba(248,113,113,0.35)", chevron: "#f87171", iconBg: "rgba(248,113,113,0.12)" },
  green:  { glow: "rgba(96,165,250,0.16)",  border: "rgba(96,165,250,0.35)",  chevron: "#60a5fa", iconBg: "rgba(96,165,250,0.12)"  },
  purple: { glow: "rgba(167,139,250,0.16)", border: "rgba(167,139,250,0.35)", chevron: "#a78bfa", iconBg: "rgba(167,139,250,0.12)" },
  orange: { glow: "rgba(251,146,60,0.16)",  border: "rgba(251,146,60,0.35)",  chevron: "#fb923c", iconBg: "rgba(251,146,60,0.12)"  },
};

interface FeaturedLink {
  id: string;
  title: string;
  href: string;
  accent: Accent;
  icon: React.ReactNode;
}

const MODES = ["Prediction", "Sports", "Trader"] as const;
type Mode = (typeof MODES)[number];

// ─── Inline icons (no external assets) ────────────────────────────────────────

function SoccerIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
      <path d="M12 7.6l2.55 1.85-0.97 3h-3.16l-0.97-3L12 7.6z" fill={color} />
      <path
        d="M12 7.6V4.2M14.55 9.45l2.95-1.1M13.42 12.45l2.1 2.45M10.58 12.45l-2.1 2.45M9.45 9.45L6.5 8.35"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="22" height="15" viewBox="0 0 22 15" fill="none">
      <rect x="0.25" y="0.25" width="21.5" height="14.5" rx="2" fill="#fff" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      <g fill="#dc2626">
        <rect y="0.5" width="22" height="2" />
        <rect y="4.5" width="22" height="2" />
        <rect y="8.5" width="22" height="2" />
        <rect y="12.5" width="22" height="2" />
      </g>
      <rect x="0.25" y="0.25" width="9" height="8.4" rx="1" fill="#3b5fc0" />
      <g fill="#fff">
        {[2, 4.5, 7].map((x) =>
          [2, 4.5, 7].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" />)
        )}
      </g>
    </svg>
  );
}

const FEATURED_LINKS: FeaturedLink[] = [
  { id: "soccer",    title: "World Soccer Cup", href: "/?category=Soccer",    accent: "blue", icon: <SoccerIcon color="#38bdf8" /> },
  { id: "elections", title: "2026 Elections",   href: "/?category=Elections", accent: "red",  icon: <FlagIcon /> },
];

// ─── Decorative coil (stands in for the Kalshi slinky) ────────────────────────

function Coil() {
  const rings = Array.from({ length: 22 });
  return (
    <svg viewBox="0 0 320 150" className="absolute inset-x-0 top-0 w-full" style={{ height: 150 }} aria-hidden>
      <defs>
        <linearGradient id="coilGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.05" />
          <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {rings.map((_, i) => {
        const cx = 26 + i * 12.6;
        const edge = Math.min(i, rings.length - 1 - i);
        const opacity = 0.25 + Math.min(edge, 6) * 0.12;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={66}
            rx={24}
            ry={56}
            fill="none"
            stroke="url(#coilGrad)"
            strokeWidth={2}
            opacity={opacity}
            transform={`rotate(-20 ${cx} 66)`}
          />
        );
      })}
    </svg>
  );
}

function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Dismiss"
      className={`text-gray-500 hover:text-white transition ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function PromoCard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-5 pb-5 pt-[120px]"
      style={{
        borderColor: "rgba(96,165,250,0.25)",
        background:
          "radial-gradient(120% 80% at 50% -10%, rgba(96,165,250,0.18) 0%, rgba(10,12,14,0) 55%), linear-gradient(180deg, #0b1310 0%, #0a0b0d 100%)",
      }}
    >
      <Coil />
      {/* fade so the coil doesn't fight the text */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: 150, background: "linear-gradient(180deg, rgba(10,11,13,0) 40%, #0a0b0d 100%)" }}
      />
      <CloseButton onClick={onClose} className="absolute top-3 right-3 z-10" />

      <div className="relative text-center">
        <h3 className="text-[20px] font-bold text-white mb-2">{PROMO.title}</h3>
        <p className="text-[13.5px] text-gray-400 leading-relaxed mb-4">{PROMO.description}</p>
        <button
          onClick={() => router.push(PROMO.href)}
          className="w-full py-3 rounded-full text-[14px] font-bold text-black transition active:scale-[0.99]"
          style={{ background: "#60a5fa" }}
        >
          {PROMO.ctaLabel}
        </button>
      </div>
    </div>
  );
}

function BannerCard({ link }: { link: FeaturedLink }) {
  const router = useRouter();
  const a = ACCENT[link.accent];
  return (
    <button
      onClick={() => router.push(link.href)}
      className="group w-full flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition hover:brightness-110 cursor-pointer"
      style={{
        borderColor: a.border,
        background: `radial-gradient(120% 140% at 0% 120%, ${a.glow} 0%, rgba(10,11,13,0) 60%), #0d0e11`,
      }}
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: a.iconBg }}
      >
        {link.icon}
      </span>
      <span className="flex-1 text-[17px] font-bold text-white truncate">{link.title}</span>
      <span className="text-xl shrink-0 group-hover:translate-x-0.5 transition" style={{ color: a.chevron }}>
        ›
      </span>
    </button>
  );
}

function CustomizeCard({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("Prediction");
  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[19px] font-bold text-white tracking-tight">Customize your view</h3>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex gap-2 mb-3">
        {MODES.map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition"
              style={
                active
                  ? { background: "rgba(255,255,255,0.92)", color: "#0a0b0d" }
                  : { background: "transparent", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {m}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-gray-500 leading-relaxed">
        Get the classic experience. You can always switch between modes in Settings later.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DiscoverSidebar() {
  const [showPromo, setShowPromo] = useState(true);
  const [showCustomize, setShowCustomize] = useState(true);

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {showPromo && <PromoCard onClose={() => setShowPromo(false)} />}

      <div className="flex flex-col gap-3">
        {FEATURED_LINKS.map((link) => (
          <BannerCard key={link.id} link={link} />
        ))}
      </div>

      {showCustomize && <CustomizeCard onClose={() => setShowCustomize(false)} />}
    </div>
  );
}
