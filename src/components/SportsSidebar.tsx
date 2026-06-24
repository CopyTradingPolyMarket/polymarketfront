"use client";

interface LeagueItem {
  code: string;
  label: string;
  count: number;
  hasLive: boolean;
}

interface Props {
  leagues: LeagueItem[];
  totalGames: number;
  activeLeague: string | null;
  onSelect: (code: string | null) => void;
}

export type { LeagueItem };

export default function SportsSidebar({ leagues, totalGames, activeLeague, onSelect }: Props) {
  const itemCls = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
      active
        ? "bg-white/[0.08] text-white"
        : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
    }`;

  return (
    <nav className="space-y-0.5">
      {/* All / Live */}
      <button onClick={() => onSelect(null)} className={itemCls(activeLeague === null)}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>Live</span>
        </div>
        <span className="text-[11px] text-gray-500 tabular-nums">{totalGames}</span>
      </button>

      {/* League items */}
      {leagues.map((lg) => (
        <button key={lg.code} onClick={() => onSelect(lg.code)} className={itemCls(activeLeague === lg.code)}>
          <div className="flex items-center gap-2 min-w-0">
            {lg.hasLive && <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />}
            <span className="truncate">{lg.label}</span>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums shrink-0 ml-2">{lg.count}</span>
        </button>
      ))}
    </nav>
  );
}
