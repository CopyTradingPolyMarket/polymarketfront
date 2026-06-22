const SLUG_PREFIX_TO_TICKER: Record<string, string> = {
  btc: 'BTC', eth: 'ETH', sol: 'SOL', xrp: 'XRP',
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL',
};

export function formatLiveCryptoTitle(slug: string): string | null {
  const prefix = slug.split('-')[0].toLowerCase();
  const ticker = SLUG_PREFIX_TO_TICKER[prefix];
  if (!ticker) return null;
  const m = slug.match(/-updown-(\d+)m-/);
  if (m) {
    const n = parseInt(m[1]);
    const dur = n >= 60 && n % 60 === 0 ? `${n / 60}h` : `${n}m`;
    return `${ticker} Up or Down ${dur}`;
  }
  if (/-up-or-down-on-/.test(slug)) return `${ticker} Up or Down Daily`;
  if (/-up-or-down-/.test(slug)) return `${ticker} Up or Down`;
  return null;
}
