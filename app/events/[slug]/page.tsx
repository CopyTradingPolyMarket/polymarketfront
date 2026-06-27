"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { isSportsEvent, SportsMarketSections } from "@/src/components/SportsSections";

import { API_BASE as API } from "@/src/config/api";
import { formatVolume } from "@/src/utils/formatters";
import { formatRangeDate } from "@/src/utils/dateFormatters";

interface Opt { label: string; probability: number }
interface Mkt {
  id: string; title: string; slug: string | null; volume: number;
  sportsMarketType: string | null; line: number | null; options: Opt[];
  groupItemTitle?: string | null;
}
interface RelEv { id: string; slug: string | null; title: string; icon: string | null }
interface EventData {
  id: string; slug: string | null; title: string; description: string | null;
  image: string | null; icon: string | null; volume: number;
  tags: string[]; markets: Mkt[]; relatedEvents: RelEv[];
}

function deriveLabel(title: string, line: number | null): { arrow: string; label: string } {
  if (line !== null) {
    const n = Number(line).toLocaleString();
    const isUp = /above|hit|higher|over|\bup\b/i.test(title);
    return { arrow: isUp ? "↑" : "↓", label: n };
  }
  const m = title.match(/(\$?[\d,]+(?:\.\d+)?)/);
  if (m) {
    const isUp = /above|hit|higher|over|\bup\b/i.test(title);
    return { arrow: isUp ? "↑" : "↓", label: m[1] };
  }
  return { arrow: "", label: title.length > 40 ? title.slice(0, 40) + "..." : title };
}

type Range = "1H"|"6H"|"1D"|"1W"|"1M"|"ALL";
const RANGE_API: Record<Range, string> = { "1H":"1h","6H":"6h","1D":"1d","1W":"1w","1M":"1m","ALL":"all" };

function PriceBtn({ label, cents, lead, selected, onClick }: { label: string; cents: number; lead: boolean; selected?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
      selected ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/40" :
      lead ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25" :
      "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
    }`}>
      {label} <span className="font-bold">{cents}¢</span>
    </button>
  );
}

function BetPanel({ market, side, onSideChange }: { market: Mkt | null; side: "yes"|"no"; onSideChange: (s: "yes"|"no") => void }) {
  const [amount, setAmount] = useState("");
  if (!market) return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
      <p className="text-gray-500 text-sm text-center py-8">Select an outcome to place a trade</p>
    </div>
  );
  const opt = side === "yes" ? market.options[0] : market.options[1];
  const prob = opt?.probability ?? 50;
  const amtNum = Number(amount) || 0;
  const shares = prob > 0 ? amtNum / (prob / 100) : 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
      <p className="text-[13px] text-gray-200 font-medium mb-3 truncate">{market.title}</p>
      <div className="flex gap-2 mb-4">
        <button onClick={() => onSideChange("yes")} className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors ${side === "yes" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"}`}>
          Yes {Math.round(market.options[0]?.probability ?? 0)}¢
        </button>
        <button onClick={() => onSideChange("no")} className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors ${side === "no" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/[0.04] text-gray-400 border border-white/[0.06]"}`}>
          No {Math.round(market.options[1]?.probability ?? 0)}¢
        </button>
      </div>
      <div className="mb-3">
        <label className="text-[11px] text-gray-500 font-medium block mb-1">Amount</label>
        <div className="flex gap-1 mb-2">
          {[1, 5, 10, 100].map(v => (
            <button key={v} onClick={() => setAmount(String((Number(amount)||0)+v))} className="px-2 py-1 rounded bg-white/[0.04] text-gray-400 text-[11px] font-medium hover:bg-white/[0.08] border border-white/[0.06]">+${v}</button>
          ))}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="$0"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-[14px] outline-none focus:border-white/20" />
      </div>
      <div className="flex justify-between text-[12px] text-gray-500 mb-4">
        <span>Potential return</span><span className="text-gray-300 tabular-nums">{shares.toFixed(2)} shares</span>
      </div>
      <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-semibold transition-colors">Trade</button>
      <p className="text-[10px] text-gray-600 text-center mt-2">By trading, you agree to the Terms of Use</p>
    </div>
  );
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [ev, setEv] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>("1M");
  const [chartData, setChartData] = useState<{ date: string; probability: number }[]>([]);
  const [selectedMkt, setSelectedMkt] = useState<Mkt | null>(null);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/events/by-slug/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: EventData) => { setEv(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  // Chart: top market's history
  const topSlug = ev?.markets[0]?.slug;
  useEffect(() => {
    if (!topSlug) return;
    fetch(`${API}/api/markets/by-slug/${topSlug}/history?range=${RANGE_API[range]}`)
      .then(r => r.ok ? r.json() : { points: [] })
      .then((d: { points: { t: string; p?: number; c?: number }[] }) => {
        setChartData((d.points ?? []).map(pt => ({
          date: formatRangeDate(pt.t, RANGE_API[range]),
          probability: pt.p ?? pt.c ?? 0,
        })));
      });
  }, [topSlug, range]);

  const totalVol = useMemo(() => ev?.volume ?? 0, [ev]);

  const handleSelect = (m: Mkt, side: "yes" | "no") => { setSelectedMkt(m); setSelectedSide(side); };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
    </div>
  );
  if (error || !ev) return (
    <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
      <p className="text-gray-400">Event not found</p>
    </div>
  );

  const primaryTag = ev.tags[0] ?? "Markets";

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <p className="text-[12px] text-gray-500">
          <span className="hover:text-gray-300 cursor-pointer" onClick={() => router.back()}>Markets</span>
          <span className="mx-1.5">·</span>
          <span>{primaryTag}</span>
        </p>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex items-start gap-4">
          {ev.icon && <img src={ev.icon} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[#1a1a1e]" />}
          <div>
            <h1 className="text-[20px] md:text-[24px] font-bold leading-tight">{ev.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-[12px] text-gray-500">
              <span>{formatVolume(totalVol, { thousandDigits: 1 })} Vol</span>
              <span>{ev.markets.length} outcome{ev.markets.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] text-gray-400 font-semibold">{ev.markets[0]?.title ?? "Price"}</p>
                  <div className="flex gap-1">
                    {(["1H","6H","1D","1W","1M","ALL"] as Range[]).map(r => (
                      <button key={r} onClick={() => setRange(r)} className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${range===r ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400"}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 5))} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={35} />
                    <Tooltip contentStyle={{ background: "rgba(10,10,13,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="probability" stroke="#3b82f6" strokeWidth={2} fill="url(#evGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Market sections */}
            {isSportsEvent(ev.markets) ? (
              <SportsMarketSections
                markets={ev.markets}
                homeTeam={ev.title.split(/\s+vs\.?\s+/i)[0] ?? ev.title}
                awayTeam={ev.title.split(/\s+vs\.?\s+/i)[1]?.replace(/ - .*$/, '') ?? ""}
                onSelect={handleSelect}
                selectedId={selectedMkt?.id ?? null}
              />
            ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-gray-200">Outcomes</h2>
                <span className="text-[11px] text-gray-600">{ev.markets.length} market{ev.markets.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-1">
                {ev.markets.map(m => {
                  const p0 = Math.round(m.options[0]?.probability ?? 0);
                  const p1 = Math.round(m.options[1]?.probability ?? 0);
                  const { arrow, label } = m.groupItemTitle
                    ? { arrow: "", label: m.groupItemTitle }
                    : deriveLabel(m.title, m.line);
                  const isSelected = selectedMkt?.id === m.id;

                  return (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${isSelected ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/[0.03] border border-transparent"}`}
                      onClick={() => handleSelect(m, "yes")}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {arrow && <span className={`text-[16px] ${arrow === "↑" ? "text-emerald-400" : "text-red-400"}`}>{arrow}</span>}
                          <span className="text-[14px] font-semibold text-gray-200 truncate">{label}</span>
                        </div>
                        <span className="text-[11px] text-gray-600">{formatVolume(m.volume, { thousandDigits: 1 })} Vol</span>
                      </div>
                      <div className="w-16 text-right">
                        <span className={`text-[16px] font-bold tabular-nums ${p0 > 50 ? "text-emerald-400" : "text-gray-300"}`}>{p0}%</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <PriceBtn label="Yes" cents={p0} lead={p0 > p1} selected={isSelected && selectedSide === "yes"} onClick={() => handleSelect(m, "yes")} />
                        <PriceBtn label="No" cents={p1} lead={p1 > p0} selected={isSelected && selectedSide === "no"} onClick={() => handleSelect(m, "no")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* Description */}
            {ev.description && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-5">
                <h3 className="text-[13px] font-semibold text-gray-400 mb-2">About</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-line">{ev.description}</p>
              </div>
            )}
          </div>

          {/* Right sidebar (desktop) */}
          <div className="hidden lg:block w-[300px] shrink-0 space-y-4 sticky top-4 self-start">
            <BetPanel market={selectedMkt} side={selectedSide} onSideChange={setSelectedSide} />

            {/* Related events */}
            {ev.relatedEvents.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] p-4">
                <p className="text-[12px] text-gray-500 font-semibold mb-3">Related</p>
                {ev.relatedEvents.map(re => (
                  <button key={re.id} onClick={() => re.slug && router.push(`/events/${re.slug}`)}
                    className="flex items-center gap-3 w-full py-2 text-left hover:bg-white/[0.03] rounded-lg px-2 transition-colors cursor-pointer">
                    {re.icon && <img src={re.icon} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#1a1a1e]" />}
                    {!re.icon && <div className="w-8 h-8 rounded-lg bg-[#1a1a1e] shrink-0" />}
                    <span className="text-[12px] text-gray-300 font-medium truncate">{re.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bet bar */}
      {selectedMkt && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0f0f12] p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-[12px] text-gray-400 truncate">{selectedMkt.title}</p>
              <p className="text-[14px] font-bold">{selectedSide === "yes" ? "Yes" : "No"} {Math.round((selectedSide === "yes" ? selectedMkt.options[0]?.probability : selectedMkt.options[1]?.probability) ?? 0)}¢</p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold shrink-0">Trade</button>
          </div>
        </div>
      )}
    </div>
  );
}
