// Shared avatar-gradient palette. Previously copy-pasted (byte-identical) in
// Comments.tsx, TopTraders.tsx and TradesPageClient.tsx.
//
// NOTE: the *selection* logic is NOT uniform across call sites:
//   - Comments derives the index from a string hash of the user id.
//   - TopTraders / TradesPageClient pick positionally by row index/rank.
// Only the positional pick is shared here (gradientByIndex); the string-hash
// pick stays local to Comments so no avatar color changes.

export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0ea5e9,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#8b5cf6,#d946ef)",
  "linear-gradient(135deg,#14b8a6,#0ea5e9)",
];

/** Positional pick used where a numeric index/rank selects the gradient. */
export function gradientByIndex(index: number): string {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}
