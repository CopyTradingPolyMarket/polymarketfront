"use client";

import { useRouter } from "next/navigation";

const G = "#34d399";

// ─── Icons (inline SVG, green wireframe style) ────────────────────────────────

function ColumnIcon() {
  return (
    <svg width="48" height="54" viewBox="0 0 48 54" fill="none">
      {/* capital */}
      <path d="M9 8h30M12 13h24" stroke={G} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="6" width="32" height="2.2" rx="1" fill={G} opacity="0.3" />
      {/* fluted shaft */}
      {[15, 19.5, 24, 28.5, 33].map((x) => (
        <line key={x} x1={x} y1="15" x2={x} y2="43" stroke={G} strokeWidth="1.3" opacity="0.85" />
      ))}
      {/* base */}
      <path d="M12 43h24M9 48h30" stroke={G} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="47" width="32" height="2.4" rx="1" fill={G} opacity="0.3" />
    </svg>
  );
}

function ShieldIcon() {
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 12 + c * 5;
      const y = 15 + r * 5.5;
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r="1" fill={G} opacity={0.75} />);
    }
  }
  return (
    <svg width="46" height="54" viewBox="0 0 46 54" fill="none">
      <defs>
        <clipPath id="shieldClip">
          <path d="M23 4L40 9.5V25c0 12-7.5 19.5-17 23C13.5 44.5 6 37 6 25V9.5L23 4z" />
        </clipPath>
      </defs>
      <path
        d="M23 4L40 9.5V25c0 12-7.5 19.5-17 23C13.5 44.5 6 37 6 25V9.5L23 4z"
        stroke={G}
        strokeWidth="1.6"
        fill="none"
      />
      <g clipPath="url(#shieldClip)">{dots}</g>
    </svg>
  );
}

function MoleculeIcon() {
  const cx = 24, cy = 24, R = 15;
  const nodes = Array.from({ length: 6 }).map((_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {nodes.map((n, i) => (
        <line key={`l${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={G} strokeWidth="1.2" opacity="0.55" />
      ))}
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={n.x} cy={n.y} r="4.2" stroke={G} strokeWidth="1.4" fill="none" />
          <circle cx={n.x} cy={n.y} r="1.4" fill={G} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r="5" stroke={G} strokeWidth="1.6" fill="none" />
      <circle cx={cx} cy={cy} r="1.9" fill={G} />
    </svg>
  );
}

// ─── Config (edit freely) ─────────────────────────────────────────────────────

interface InfoCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const CARDS: InfoCard[] = [
  { id: "monopolies", title: "Markets over Monopolies", description: "How fair markets protect consumers", href: "/learn/markets-over-monopolies", icon: <ColumnIcon /> },
  { id: "responsible", title: "Responsible Trading",    description: "Tools and tips for trading smart",   href: "/learn/responsible-trading",    icon: <ShieldIcon /> },
  { id: "integrity",   title: "Market Integrity",        description: "Learn how we prevent insider trading", href: "/learn/market-integrity",      icon: <MoleculeIcon /> },
];

// ─── Card + row ───────────────────────────────────────────────────────────────

function Card({ card }: { card: InfoCard }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(card.href)}
      className="group flex items-center gap-4 w-full text-left rounded-2xl border px-5 py-5 transition hover:brightness-110 cursor-pointer"
      style={{
        borderColor: "rgba(52,211,153,0.14)",
        background: "radial-gradient(130% 130% at 0% 0%, rgba(52,211,153,0.07) 0%, rgba(10,12,13,0) 55%), #0c100e",
      }}
    >
      <span className="shrink-0 w-12 flex items-center justify-center">{card.icon}</span>

      <div className="flex-1 min-w-0">
        <h3 className="text-[12px] font-bold text-white leading-snug">{card.title}</h3>
        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{card.description}</p>
      </div>

      <span className="text-xl shrink-0 group-hover:translate-x-0.5 transition" style={{ color: G }}>›</span>
    </button>
  );
}

export default function InfoCards() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-[3%]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {CARDS.map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </div>
  );
}
