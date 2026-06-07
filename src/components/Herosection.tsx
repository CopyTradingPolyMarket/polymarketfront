"use client";

import { useState, useCallback } from "react";
import FeaturedMarkets, { FEATURED_MARKETS } from "./Featuredmarkets";
import TopTraders from "./TopTraders";

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

        {/* LEFT — carousel + controls below */}
        <div className="flex-1 min-w-0 flex flex-col">
          <FeaturedMarkets
            externalIndex={index}
            setExternalIndex={setIndex}
            paused={paused}
            setPaused={setPaused}
          />

          {/* Pagination + Explore — sits right below the chart */}
          <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: total }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goto(i)}
                  aria-label={`Slide ${i + 1}`}
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

            {/* Explore + arrows */}
            <div className="flex items-center gap-2">
              <button className="py-1.5 px-4 text-[12px] font-medium text-gray-500 border border-white/[0.07] rounded-xl hover:text-white hover:border-white/15 hover:bg-white/[0.03] transition-all">
                Explore all markets →
              </button>
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
        </div>

        {/* RIGHT — Top Traders, samostalna kartica bez ikakvih kontrola */}
        <aside className="w-full lg:w-[288px] shrink-0">
          <div
            className="rounded-2xl flex flex-col px-4 py-4 border border-white/[0.07]"
            style={{ background: "#111214", height: 580 }}
          >
            <div className="flex-1 min-h-0 flex flex-col">
              <TopTraders />
            </div>
          </div>
        </aside>

      </div>
    </section>
  );
}