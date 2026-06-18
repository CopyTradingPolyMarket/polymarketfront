export default function AllTradersLoading() {
  return (
    <div className="min-h-screen px-4 py-8 animate-pulse" style={{ background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="h-8 w-32 rounded-lg mb-2" style={{ background: "#1a1b1e" }} />
          <div className="h-4 w-48 rounded" style={{ background: "#1a1b1e" }} />
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Controls bar skeleton */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 h-9 rounded-xl" style={{ background: "#1a1b1e" }} />
              <div className="h-9 w-64 rounded-xl" style={{ background: "#1a1b1e" }} />
              <div className="h-9 w-40 rounded-xl" style={{ background: "#1a1b1e" }} />
            </div>

            {/* Results count */}
            <div className="h-3 w-40 rounded mb-3" style={{ background: "#1a1b1e" }} />

            {/* Grid cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] overflow-hidden"
                  style={{ background: "#0e0f11" }}
                >
                  <div className="h-0.5 w-full" style={{ background: "#1a1b1e" }} />
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-5 h-4 rounded" style={{ background: "#1a1b1e" }} />
                      <div className="w-9 h-9 rounded-xl" style={{ background: "#1a1b1e" }} />
                      <div>
                        <div className="h-3 w-24 rounded mb-1" style={{ background: "#1a1b1e" }} />
                        <div className="h-2.5 w-16 rounded" style={{ background: "#1a1b1e" }} />
                      </div>
                    </div>
                    <div className="h-6 w-28 rounded mb-1" style={{ background: "#1a1b1e" }} />
                    <div className="h-3 w-20 rounded mb-3" style={{ background: "#1a1b1e" }} />
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.05]">
                      {[0, 1, 2].map((j) => (
                        <div key={j}>
                          <div className="h-3 w-10 rounded mb-1" style={{ background: "#1a1b1e" }} />
                          <div className="h-2.5 w-12 rounded" style={{ background: "#1a1b1e" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden md:block w-[240px] shrink-0">
            <div className="rounded-2xl border border-white/[0.07] px-4 py-4" style={{ background: "#111214" }}>
              <div className="h-4 w-24 rounded mb-3" style={{ background: "#1a1b1e" }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl" style={{ background: "#1a1b1e" }} />
                <div>
                  <div className="h-4 w-24 rounded mb-1" style={{ background: "#1a1b1e" }} />
                  <div className="h-3 w-16 rounded" style={{ background: "#1a1b1e" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.05]">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="text-center">
                    <div className="h-4 w-12 rounded mx-auto mb-1" style={{ background: "#1a1b1e" }} />
                    <div className="h-2.5 w-10 rounded mx-auto" style={{ background: "#1a1b1e" }} />
                  </div>
                ))}
              </div>
              <div className="h-8 w-full rounded-xl mt-3" style={{ background: "#1a1b1e" }} />
            </div>

            <div className="rounded-2xl border border-white/[0.07] px-4 py-4 mt-4" style={{ background: "#111214" }}>
              <div className="h-4 w-20 rounded mb-3" style={{ background: "#1a1b1e" }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-full rounded-xl mb-2" style={{ background: "#1a1b1e" }} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
