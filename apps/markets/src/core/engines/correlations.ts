// Rolling correlation across symbols (M3c task 4): the Pearson correlation of
// 1-second log returns between every pair of symbols, over three horizons, as
// a cross-asset dashboard computes it. Plain functions, no Isoloop imports.
import type { Correlations, Sym, Trade } from '../schemas';

/** The horizons, in ms: one, five and fifteen minutes. */
export const HORIZONS = [60_000, 300_000, 900_000] as const;

export class CorrelationEngine {
  readonly #last = new Map<Sym, number>();
  /** Per symbol, the last price in each second, oldest first, forward-filled. */
  readonly #series = new Map<Sym, number[]>();
  readonly #keep: number;

  constructor(maxHorizonMs: number = HORIZONS[HORIZONS.length - 1] ?? 900_000) {
    this.#keep = Math.ceil(maxHorizonMs / 1000) + 1;
  }

  addTrade(t: Trade): void {
    this.#last.set(t.symbol, t.price);
  }

  /** Closes a second: every symbol with a price gets one sample. */
  sample(): void {
    for (const [s, p] of this.#last) {
      const xs = this.#series.get(s) ?? [];
      xs.push(p);
      if (xs.length > this.#keep) xs.splice(0, xs.length - this.#keep);
      this.#series.set(s, xs);
    }
  }

  /**
   * The correlation matrix over the last `horizonMs` for the symbols with at
   * least 3 returns in it, row-major; null when fewer than two qualify.
   */
  compute(horizonMs: number, now: number): Correlations | null {
    const n = Math.ceil(horizonMs / 1000);
    const symbols: Sym[] = [];
    const returns: number[][] = [];
    for (const [s, xs] of this.#series) {
      const tail = xs.slice(-(n + 1));
      if (tail.length < 4) continue;
      const r: number[] = [];
      for (let i = 1; i < tail.length; i++) r.push(Math.log((tail[i] ?? 1) / (tail[i - 1] ?? 1)));
      symbols.push(s);
      returns.push(r);
    }
    if (symbols.length < 2) return null;
    const k = symbols.length;
    const matrix: number[] = Array.from({ length: k * k }, () => 0);
    for (let i = 0; i < k; i++) {
      matrix[i * k + i] = 1;
      for (let j = i + 1; j < k; j++) {
        const c = pearson(returns[i] ?? [], returns[j] ?? []);
        matrix[i * k + j] = c;
        matrix[j * k + i] = c;
      }
    }
    return { horizonMs, symbols, matrix, ts: now };
  }
}

/** Pearson correlation over the common tail of `a` and `b`; 0 when either is flat. */
export function pearson(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const oa = a.length - n;
  const ob = b.length - n;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[oa + i] ?? 0;
    mb += b[ob + i] ?? 0;
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = (a[oa + i] ?? 0) - ma;
    const y = (b[ob + i] ?? 0) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}
