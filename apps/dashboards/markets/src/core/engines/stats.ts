// Rolling statistics per symbol across exchanges (M3c task 3): VWAP,
// volatility and a volume profile over a trailing window, as a markets
// dashboard computes them for its charts. Plain functions, no Isoloop imports.
import type { Stats, Sym, Trade } from '../schemas';

/** Price buckets in the volume profile. */
export const PROFILE_BINS = 24;

export class StatsEngine {
  readonly #trades = new Map<Sym, Trade[]>();

  addTrade(t: Trade): void {
    const list = this.#trades.get(t.symbol);
    if (list) list.push(t);
    else this.#trades.set(t.symbol, [t]);
  }

  /**
   * `symbol`'s figures at `now` over the last `windowMs`, or null with fewer
   * than two trades in it. Older trades are dropped.
   *
   * - `vwap`: volume-weighted average price;
   * - `volatility`: the standard deviation of 1-second log returns of the
   *   last trade price in each second;
   * - `profile`: volume per price bucket between the window's low and high.
   */
  compute(symbol: Sym, now: number, windowMs: number): Stats | null {
    const from = now - windowMs;
    const all = this.#trades.get(symbol) ?? [];
    let first = 0;
    while (first < all.length && (all[first]?.ts ?? 0) <= from) first++;
    const kept = first > 0 ? all.slice(first) : all;
    this.#trades.set(symbol, kept);
    if (kept.length < 2) return null;

    let notional = 0;
    let volume = 0;
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    const lastPerSecond = new Map<number, number>();
    for (const t of kept) {
      notional += t.price * t.size;
      volume += t.size;
      lo = Math.min(lo, t.price);
      hi = Math.max(hi, t.price);
      lastPerSecond.set(Math.floor(t.ts / 1000), t.price);
    }

    const seconds = [...lastPerSecond.keys()].toSorted((a, b) => a - b);
    const returns: number[] = [];
    for (let i = 1; i < seconds.length; i++) {
      const a = lastPerSecond.get(seconds[i - 1] ?? 0) ?? 0;
      const b = lastPerSecond.get(seconds[i] ?? 0) ?? 0;
      if (a > 0 && b > 0) returns.push(Math.log(b / a));
    }
    const volatility = stddev(returns);

    const profile: number[] = Array.from({ length: PROFILE_BINS }, () => 0);
    const span = hi - lo;
    for (const t of kept) {
      const i =
        span > 0
          ? Math.min(PROFILE_BINS - 1, Math.floor(((t.price - lo) / span) * PROFILE_BINS))
          : 0;
      profile[i] = (profile[i] ?? 0) + t.size;
    }
    return {
      symbol,
      vwap: volume > 0 ? notional / volume : 0,
      volatility,
      volume,
      trades: kept.length,
      lo,
      hi,
      profile,
      windowMs,
      ts: now,
    };
  }
}

export function stddev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  let mean = 0;
  for (const x of xs) mean += x;
  mean /= xs.length;
  let v = 0;
  for (const x of xs) v += (x - mean) ** 2;
  return Math.sqrt(v / (xs.length - 1));
}
