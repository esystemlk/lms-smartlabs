import "server-only";

/**
 * Live LKR per 1 USD. Uses the free open.er-api.com feed (no key), cached for 6 hours by Next's fetch cache
 * and in memory. Falls back to the last good rate, then to a safe constant, so checkout never breaks.
 */
const FALLBACK_LKR_PER_USD = 330; // only if the feed is down and nothing is cached
let last: { rate: number; at: number; fetchedAt: number; source: string } | null = null;

export async function getLkrPerUsd(): Promise<{ rate: number; updatedAt: number; source: string }> {
  if (last && Date.now() - last.fetchedAt < 6 * 3600_000) return { rate: last.rate, updatedAt: last.at, source: last.source };
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 21600 } });
    if (res.ok) {
      const data = await res.json();
      const rate = Number(data?.rates?.LKR);
      if (Number.isFinite(rate) && rate > 100 && rate < 1000) {
        const at = Number(data?.time_last_update_unix) * 1000 || Date.now();
        last = { rate, at, fetchedAt: Date.now(), source: "live" };
        return { rate, updatedAt: at, source: "live" };
      }
    }
  } catch { /* fall through */ }
  if (last) return { rate: last.rate, updatedAt: last.at, source: "cached" };
  return { rate: FALLBACK_LKR_PER_USD, updatedAt: Date.now(), source: "fallback" };
}
