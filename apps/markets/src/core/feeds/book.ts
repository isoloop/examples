// An order book kept from snapshots and level updates (size 0 removes a
// level), for feeds that send diffs. Its top is what book.v1 carries.
export class OrderBook {
  readonly #bids = new Map<number, number>();
  readonly #asks = new Map<number, number>();

  clear(): void {
    this.#bids.clear();
    this.#asks.clear();
  }

  set(side: 'bid' | 'ask', price: number, size: number): void {
    const m = side === 'bid' ? this.#bids : this.#asks;
    if (size <= 0) m.delete(price);
    else m.set(price, size);
  }

  /**
   * Drops levels past the best `n` a side. Feeds that send a fixed depth
   * (Kraken) expect it: a level that falls out of the depth gets no delete.
   */
  trim(n: number): void {
    const { bids, asks } = this.top(n);
    if (this.#bids.size > n) {
      this.#bids.clear();
      for (const [p, sz] of bids) this.#bids.set(p, sz);
    }
    if (this.#asks.size > n) {
      this.#asks.clear();
      for (const [p, sz] of asks) this.#asks.set(p, sz);
    }
  }

  /** The best `n` levels a side, best first. */
  top(n: number): { bids: [number, number][]; asks: [number, number][] } {
    const pick = (m: Map<number, number>, desc: boolean): [number, number][] =>
      [...m]
        .toSorted((a, b) => (desc ? b[0] - a[0] : a[0] - b[0]))
        .slice(0, n)
        .map(([p, s]) => [p, s]);
    return { bids: pick(this.#bids, true), asks: pick(this.#asks, false) };
  }
}
