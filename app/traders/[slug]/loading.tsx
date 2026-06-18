function SkeletonBox({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded ${className ?? ""}`}
      style={{ background: "#1a1b1e", ...style }}
    />
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Banner */}
      <div className="w-full h-36" style={{ background: "#111214" }} />

      <div className="max-w-6xl mx-auto px-4 flex gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-6">
            {/* Avatar + name */}
            <div className="flex items-end gap-4" style={{ marginTop: -40 }}>
              <SkeletonBox style={{ width: 80, height: 80, borderRadius: 16, flexShrink: 0 }} />
              <div className="mb-1 flex flex-col gap-2">
                <SkeletonBox style={{ width: 160, height: 22 }} />
                <SkeletonBox style={{ width: 90, height: 12 }} />
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4 flex flex-col gap-2">
              <SkeletonBox style={{ width: 380, height: 12 }} />
              <SkeletonBox style={{ width: 260, height: 12 }} />
              <div className="flex gap-4 mt-1">
                <SkeletonBox style={{ width: 80, height: 10 }} />
                <SkeletonBox style={{ width: 80, height: 10 }} />
                <SkeletonBox style={{ width: 70, height: 10 }} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBox key={i} style={{ height: 68, borderRadius: 12 }} />
              ))}
            </div>

            {/* Chart */}
            <SkeletonBox style={{ height: 290, borderRadius: 16, marginTop: 24 }} />

            {/* Trade rows */}
            <div className="mt-6 mb-10 flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBox key={i} style={{ height: 84, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="hidden lg:block pt-6">
          <SkeletonBox style={{ width: 260, height: 420, borderRadius: 16 }} />
        </div>
      </div>
    </div>
  );
}
