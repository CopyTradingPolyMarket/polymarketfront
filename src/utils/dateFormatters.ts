// Shared date / relative-time formatters.
// Centralizes variants that previously lived inline across several components.

/** "Jun 27" — short month + day. Accepts an ms epoch or an ISO string. */
export function formatShortDate(value: number | string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Range-aware chart axis label, keyed by API range token (1h/6h/1d/1w/...). */
export function formatRangeDate(iso: string, range: string): string {
  const d = new Date(iso);
  if (range === "1h" || range === "6h")
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (range === "1d" || range === "1w")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", hour12: false });
  return formatShortDate(iso);
}

/** Relative time: "now" / "5m" / "3h" / "2d", then falls back to "Jun 27". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 30) return `${d}d`;
  return formatShortDate(iso);
}
