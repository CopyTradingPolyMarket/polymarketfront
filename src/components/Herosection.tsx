"use client";

import { useState, useCallback } from "react";
import FeaturedMarkets, { FEATURED_MARKETS } from "./Featuredmarkets";

interface BreakingItem {
  id: number;
  title: string;
  percent: number;
  delta: number;
}

interface HotTopic {
  rank: number;
  label: string;
  volume: string;
  category: string;
}

const BREAKING: BreakingItem[] = [
  { id: 1, title: "Will Tom Steyer advance from the 2026 California Governor primary?", percent: 11, delta: -38 },
  { id: 2, title: "Will the New York Knicks win the 2026 NBA Finals?",                  percent: 79, delta:  27 },
  { id: 3, title: "Will Karl-Anthony Towns win the 2026 NBA Finals MVP?",               percent: 33, delta:  26 },
];

const HOT_TOPICS: HotTopic[] = [
  { rank: 1, label: "NBA",    volume: "$7M today",  category: "Sports"    },
  { rank: 2, label: "Knicks", volume: "$8M today",  category: "Sports"    },
  { rank: 3, label: "Fed",    volume: "$13M today", category: "Finance"   },
  { rank: 4, label: "Spurs",  volume: "$8M today",  category: "Sports"    },
  { rank: 5, label: "Futures",volume: "$3M today",  category: "Crypto"    },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Sports:  { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa"  },
  Finance: { bg: "rgba(234,179,8,0.12)",   text: "#facc15"  },
  Crypto:  { bg: "rgba(16,185,129,0.12)",  text: "#34d399"  },
  Politics:{ bg: "rgba(139,92,246,0.12)",  text: "#a78bfa"  },
};

function ArrowUp() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightNav() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BreakingNews() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Breaking</span>
        </div>
        <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5">
          All <ChevronRight />
        </button>
      </div>

      <div className="space-y-0 divide-y divide-white/[0.04]">
        {BREAKING.map((item) => {
          const isUp = item.delta >= 0;
          return (
            <div key={item.id} className="flex items-start gap-2.5 py-3 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-3 shrink-0 pt-0.5 font-medium tabular-nums">{item.id}</span>
              <p className="flex-1 text-[12px] text-gray-400 leading-snug group-hover:text-gray-200 transition-colors line-clamp-2 min-w-0">
                {item.title}
              </p>
              <div className="shrink-0 text-right ml-1">
                <div className="text-[13px] font-bold text-white tabular-nums">{item.percent}%</div>
                <div
                  className="flex items-center justify-end gap-0.5 text-[10px] font-semibold mt-0.5"
                  style={{ color: isUp ? "#34d399" : "#f87171" }}
                >
                  {isUp ? <ArrowUp /> : <ArrowDown />}
                  {Math.abs(item.delta)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HotTopics() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#f97316", fontSize: 13 }}>🔥</span>
          <span className="text-[12px] font-semibold text-gray-200 tracking-wide">Hot topics</span>
        </div>
        <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5">
          All <ChevronRight />
        </button>
      </div>

      <div className="space-y-0 divide-y divide-white/[0.04]">
        {HOT_TOPICS.map((topic) => {
          const cat = categoryColors[topic.category] ?? { bg: "rgba(255,255,255,0.06)", text: "#9ca3af" };
          return (
            <div key={topic.rank} className="flex items-center gap-2.5 py-2.5 group cursor-pointer">
              <span className="text-[10px] text-gray-700 w-3 shrink-0 font-medium tabular-nums">{topic.rank}</span>
              <span className="flex-1 text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors">
                {topic.label}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ background: cat.bg, color: cat.text }}
              >
                {topic.category}
              </span>
              <span className="text-[11px] text-gray-600 shrink-0 tabular-nums">{topic.volume}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = FEATURED_MARKETS.length;

  const prev = useCallback(() => { setIndex((i) => Math.max(0, i - 1)); setPaused(true); }, []);
  const next = useCallback(() => { setIndex((i) => (i + 1) % total); setPaused(true); }, [total]);
  const goto = useCallback((i: number) => { setIndex(i); setPaused(true); }, []);

  return (
    <section
      className="w-full border-b border-white/[0.05] px-4 py-5"
      style={{ background: "#111113", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-4 lg:items-stretch">

        {/* LEFT — carousel */}
        <div className="flex-1 min-w-0">
          <FeaturedMarkets
            externalIndex={index}
            setExternalIndex={setIndex}
            paused={paused}
            setPaused={setPaused}
          />
        </div>

        {/* RIGHT — sidebar */}
        <aside className="w-full lg:w-[288px] shrink-0">
          <div
            className="h-full rounded-2xl flex flex-col px-4 py-4 border border-white/[0.07]"
            style={{ background: "#111214" }}
          >
            <BreakingNews />

            <div className="my-4 border-t border-white/[0.05]" />

            <HotTopics />

            {/* Bottom controls */}
            <div className="mt-auto pt-4 border-t border-white/[0.05]">
              {/* Carousel dots + arrows */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 items-center">
                  {Array.from({ length: total }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goto(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="transition-all duration-300"
                    >
                      <span
                        className="block rounded-full transition-all duration-300"
                        style={{
                          width: i === index ? 20 : 6,
                          height: 6,
                          background: i === index ? "#fff" : "rgba(255,255,255,0.15)",
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={prev}
                    disabled={index === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={next}
                    disabled={index === total - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRightNav />
                  </button>
                </div>
              </div>

              {/* Explore button */}
              <button className="w-full mt-3 py-2 text-[12px] font-medium text-gray-500 border border-white/[0.07] rounded-xl hover:text-white hover:border-white/15 hover:bg-white/[0.03] transition-all">
                Explore all markets →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
