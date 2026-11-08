// The consolidated order-book depth per symbol (M3c task 5): every exchange's
// latest book, merged into size per price bucket around the mid, once a
// second, for a depth heatmap over time. Plain functions, no Isoloop imports.
import type { Book, Depth, Exchange, Sym } from '../schemas';

/** Buckets per side, and each bucket's width as a fraction of the mid. */
export const DEPTH_BUCKETS = 20;
export const DEPTH_STEP = 0.0001;

export class DepthEngine {
  readonly #books = new Map<Sym, Map<Exchange, Book>>();

  setBook(b: Book): void {
    const m = this.#books.get(b.symbol) ?? new Map<Exchange, Book>();
    m.set(b.exchange, b);
    this.#books.set(b.symbol, m);
  }

  /**
   * `symbol`'s depth now: the mid is the midpoint of the best bid and ask
   * across exchanges; each level's size goes to the bucket of its distance
   * from the mid, and levels beyond the last bucket are left out.
   */
  compute(symbol: Sym, now: number): Depth | null {
    const books = [...(this.#books.get(symbol)?.values() ?? [])];
    let bestBid = 0;
    let bestAsk = Number.POSITIVE_INFINITY;
    for (const b of books) {
      bestBid = Math.max(bestBid, b.bids[0]?.[0] ?? 0);
      bestAsk = Math.min(bestAsk, b.asks[0]?.[0] ?? Number.POSITIVE_INFINITY);
    }
    if (bestBid <= 0 || !Number.isFinite(bestAsk)) return null;
    const mid = (bestBid + bestAsk) / 2;
    const width = mid * DEPTH_STEP;
    const bids: number[] = Array.from({ length: DEPTH_BUCKETS }, () => 0);
    const asks: number[] = Array.from({ length: DEPTH_BUCKETS }, () => 0);
    for (const b of books) {
      for (const [price, size] of b.bids) {
        const i = Math.floor((mid - price) / width);
        if (i >= 0 && i < DEPTH_BUCKETS) bids[i] = (bids[i] ?? 0) + size;
      }
      for (const [price, size] of b.asks) {
        const i = Math.floor((price - mid) / width);
        if (i >= 0 && i < DEPTH_BUCKETS) asks[i] = (asks[i] ?? 0) + size;
      }
    }
    return { symbol, mid, step: DEPTH_STEP, bids, asks, ts: now };
  }
}
