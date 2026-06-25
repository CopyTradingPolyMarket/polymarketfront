"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Slide {
  step: number;
  title: string;
  description: string;
  illustration: React.ReactNode;
  accent: string; // tailwind bg color class for the step badge
}

// ─── Slide Illustrations (pure SVG, no external deps) ────────────────────────

function MarketIllustration() {
  return (
    <svg viewBox="0 0 400 260" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Background glow */}
      <ellipse cx="200" cy="130" rx="160" ry="90" fill="#1d4ed8" fillOpacity="0.08" />

      {/* Market card */}
      <rect x="60" y="40" width="280" height="160" rx="14" fill="#18191d" stroke="#2a2b30" strokeWidth="1.5" />

      {/* Flag + label */}
      <rect x="82" y="62" width="22" height="16" rx="3" fill="#ef4444" />
      <rect x="82" y="62" width="22" height="8" rx="3" fill="#ef4444" />
      <rect x="82" y="70" width="22" height="8" rx="0" fill="#ffffff" fillOpacity="0.9"/>
      <rect x="82" y="70" width="22" height="8" rx="3" fill="#3b82f6" />

      <text x="114" y="74" fontFamily="DM Sans, sans-serif" fontSize="11" fill="#6b7280">Politics · Global Elections</text>
      <text x="82" y="100" fontFamily="DM Sans, sans-serif" fontSize="16" fontWeight="600" fill="#f3f4f6">Peru Presidential Election</text>

      {/* Candidates */}
      <circle cx="92" cy="128" r="10" fill="#374151" />
      <text x="92" y="132" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#9ca3af">K</text>
      <text x="110" y="132" fontFamily="DM Sans, sans-serif" fontSize="12" fill="#e5e7eb">Keiko Fujimori</text>
      <text x="300" y="132" textAnchor="end" fontFamily="DM Sans, sans-serif" fontSize="13" fontWeight="700" fill="#f3f4f6">62%</text>

      <circle cx="92" cy="154" r="10" fill="#374151" />
      <text x="92" y="158" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#9ca3af">R</text>
      <text x="110" y="158" fontFamily="DM Sans, sans-serif" fontSize="12" fill="#e5e7eb">Roberto S. Palomino</text>
      <text x="300" y="158" textAnchor="end" fontFamily="DM Sans, sans-serif" fontSize="13" fontWeight="700" fill="#f3f4f6">38%</text>

      {/* Yes / No buttons */}
      <rect x="82" y="172" width="56" height="22" rx="6" fill="#16a34a" />
      <text x="110" y="187" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="600" fill="#fff">Yes</text>
      <rect x="146" y="172" width="56" height="22" rx="6" fill="#dc2626" />
      <text x="174" y="187" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="600" fill="#fff">No</text>

      {/* Chart line */}
      <polyline points="220,175 240,155 260,160 280,140 300,145 320,125 330,130" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="330" cy="130" r="3.5" fill="#3b82f6" />

      {/* Floating badge */}
      <rect x="240" y="50" width="100" height="28" rx="8" fill="#1e3a5f" stroke="#2563eb" strokeWidth="1" />
      <text x="290" y="69" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="600" fill="#60a5fa">$65M Volume</text>
    </svg>
  );
}

function TradeIllustration() {
  return (
    <svg viewBox="0 0 400 260" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="130" rx="150" ry="85" fill="#7c3aed" fillOpacity="0.07" />

      {/* Phone frame */}
      <rect x="140" y="20" width="120" height="220" rx="18" fill="#18191d" stroke="#2a2b30" strokeWidth="1.5" />
      <rect x="155" y="35" width="90" height="170" rx="8" fill="#0E0E10" />

      {/* Balance */}
      <text x="200" y="65" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#6b7280">Your Balance</text>
      <text x="200" y="85" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="20" fontWeight="700" fill="#f3f4f6">$1,250.00</text>

      {/* Payment methods */}
      <rect x="158" y="96" width="84" height="22" rx="5" fill="#1a1b1e" stroke="#374151" strokeWidth="1" />
      <rect x="161" y="102" width="10" height="10" rx="2" fill="#f97316" />
      <text x="177" y="111" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9ca3af">Crypto</text>

      <rect x="158" y="122" width="84" height="22" rx="5" fill="#1a1b1e" stroke="#2563eb" strokeWidth="1.5" />
      <rect x="161" y="128" width="10" height="10" rx="2" fill="#2563eb" />
      <text x="177" y="137" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#93c5fd">Debit Card</text>

      <rect x="158" y="148" width="84" height="22" rx="5" fill="#1a1b1e" stroke="#374151" strokeWidth="1" />
      <rect x="161" y="154" width="10" height="10" rx="2" fill="#10b981" />
      <text x="177" y="163" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9ca3af">Bank Transfer</text>

      {/* Deposit button */}
      <rect x="158" y="178" width="84" height="24" rx="7" fill="#2563eb" />
      <text x="200" y="194" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fontWeight="600" fill="#fff">Deposit Funds</text>

      {/* Home indicator */}
      <rect x="185" y="228" width="30" height="3" rx="1.5" fill="#374151" />

      {/* Floating coins */}
      <circle cx="100" cy="80" r="18" fill="#1a1b1e" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="100" y="85" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="700" fill="#f59e0b">₿</text>

      <circle cx="305" cy="160" r="14" fill="#1a1b1e" stroke="#10b981" strokeWidth="1.5" />
      <text x="305" y="165" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fontWeight="700" fill="#10b981">$</text>
    </svg>
  );
}

function WinIllustration() {
  return (
    <svg viewBox="0 0 400 260" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="130" rx="160" ry="90" fill="#10b981" fillOpacity="0.07" />

      {/* Trophy base */}
      <rect x="175" y="195" width="50" height="8" rx="3" fill="#374151" />
      <rect x="185" y="188" width="30" height="10" rx="2" fill="#4b5563" />

      {/* Trophy cup */}
      <path d="M155 80 Q155 165 200 165 Q245 165 245 80 Z" fill="#1a1b1e" stroke="#f59e0b" strokeWidth="2" />
      <path d="M155 80 Q140 80 140 105 Q140 130 160 130" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M245 80 Q260 80 260 105 Q260 130 240 130" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Star in trophy */}
      <text x="200" y="135" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="32" fill="#f59e0b">★</text>

      {/* Profit badge */}
      <rect x="250" y="55" width="100" height="38" rx="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
      <text x="300" y="72" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#6ee7b7">Profit</text>
      <text x="300" y="86" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="14" fontWeight="700" fill="#10b981">+$430.00</text>

      {/* Confetti dots */}
      {[
        [80, 60, "#f59e0b"], [90, 100, "#3b82f6"], [70, 140, "#ec4899"],
        [330, 70, "#10b981"], [320, 115, "#f59e0b"], [340, 150, "#8b5cf6"],
        [110, 175, "#3b82f6"], [300, 180, "#ec4899"],
      ].map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r="5" fill={fill as string} fillOpacity="0.8" />
      ))}

      {/* Resolution text */}
      <rect x="50" y="195" width="120" height="32" rx="8" fill="#18191d" stroke="#2a2b30" strokeWidth="1" />
      <text x="110" y="209" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="9" fill="#6b7280">Market resolved</text>
      <text x="110" y="222" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fontWeight="600" fill="#10b981">✓ Keiko wins — paid out</text>
    </svg>
  );
}

// ─── Slide data ───────────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  {
    step: 1,
    title: "Pick a Market",
    description:
      "Buy 'Yes' or 'No' shares depending on your prediction. Odds shift in real time as other traders get in on the action.",
    illustration: <MarketIllustration />,
    accent: "bg-[#34d399]",
  },
  {
    step: 2,
    title: "Place a Trade",
    description:
      "Fund your account with crypto, debit card, or bank transfer — then you're ready to trade. Positions are settled instantly on-chain.",
    illustration: <TradeIllustration />,
    accent: "bg-violet-600",
  },
  {
    step: 3,
    title: "Collect Your Winnings",
    description:
      "When the market resolves, winning shares pay out $1 each. Withdraw your profits to your wallet or reinvest into the next big event.",
    illustration: <WinIllustration />,
    accent: "bg-emerald-600",
  },
];

// ─── Close icon ───────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [visible, setVisible] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Slight delay so CSS transition fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        document.body.style.overflow = "";
        setCurrent(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const go = useCallback(
    (dir: 1 | -1) => {
      const next = current + dir;
      if (next < 0 || next >= SLIDES.length) return;
      setAnimDir(dir === 1 ? "right" : "left");
      setCurrent(next);
    },
    [current]
  );

  const isLast = current === SLIDES.length - 1;

  if (!isOpen && !visible) return null;

  const modal = (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        transition-all duration-300
        ${visible ? "opacity-100" : "opacity-0"}
      `}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className={`
          relative z-10 w-full max-w-md mx-4
          bg-[#0E0E10] border border-[#1e1f23] rounded-2xl
          shadow-2xl overflow-hidden
          transition-all duration-300
          ${visible ? "translate-y-0 scale-100" : "translate-y-6 scale-95"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
              How it works
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1a1b1e] transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Slide */}
        <div className="px-6 pt-4 pb-6">
          {/* Illustration area */}
          <div
            key={current + animDir}
            className="w-full h-[220px] rounded-xl bg-[#18191d] border border-[#1e1f23] mb-6 overflow-hidden
              animate-slide-in"
            style={{
              animationDuration: "300ms",
              animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {SLIDES[current].illustration}
          </div>

          {/* Step badge + text */}
          <div
            key={`text-${current}`}
            className="animate-fade-in"
            style={{ animationDuration: "250ms", animationDelay: "60ms" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`
                  ${SLIDES[current].accent}
                  text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                `}
              >
                Step {SLIDES[current].step}
              </span>
              <span className="text-gray-600 text-[11px]">of {SLIDES.length}</span>
            </div>

            <h2 className="text-xl font-semibold text-white mb-2 leading-tight">
              {SLIDES[current].title}
            </h2>
            <p className="text-[14px] text-gray-400 leading-relaxed">
              {SLIDES[current].description}
            </p>
          </div>
        </div>

        {/* Footer: dots + navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e1f23]">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setAnimDir(i > current ? "right" : "left");
                  setCurrent(i);
                }}
                className={`
                  rounded-full transition-all duration-200
                  ${i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-[#2a2b30] hover:bg-[#4b5563]"}
                `}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                onClick={() => go(-1)}
                className="px-4 py-2 text-[13px] text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1b1e] transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={onClose}
                className="px-5 py-2 text-[13px] font-semibold text-white bg-[#34d399] hover:bg-[#3ee6aa] rounded-lg transition-colors cursor-pointer"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={() => go(1)}
                className="px-5 py-2 text-[13px] font-semibold text-white bg-[#34d399] hover:bg-[#3ee6aa] rounded-lg transition-colors cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in var(--dur, 300ms) ease both; }
        .animate-fade-in  { animation: fade-in var(--dur, 250ms) ease both; }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modal, document.body);
}
