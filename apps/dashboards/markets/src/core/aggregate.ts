// Cross-market figures per symbol: VWAP and volume over a trailing window of
// trades from every exchange, and the spread between the best ask and the
// best bid across exchanges' latest quotes (negative when markets cross).
import type { Aggregate, Exchange, Quote, Sym, Trade } from './schemas';

export class Aggregator {
  readonly #trades = new Map<Sym, Trade[]>();
  readonly #quotes = new Map<Sym, Map<Exchange, Quote>>();

  addTrade(t: Trade): void {
    const list = this.#trades.get(t.symbol) ?? [];
    list.push(t);
    this.#trades.set(t.symbol, list);
  }

  setQuote(q: Quote): void {
    const m = this.#quotes.get(q.symbol) ?? new Map<Exchange, Quote>();
    m.set(q.exchange, q);
    this.#quotes.set(q.symbol, m);
  }

  /**
   * The figures for `symbol` at `now` over the last `windowMs`, or null with
   * no trades in the window. Trades older than the window are dropped.
   */
  compute(symbol: Sym, now: number, windowMs: number): Aggregate | null {
    const from = now - windowMs;
    const kept = (this.#trades.get(symbol) ?? []).filter((t) => t.ts > from && t.ts <= now);
    this.#trades.set(symbol, kept);
    let notional = 0;
    let volume = 0;
    for (const t of kept) {
      notional += t.price * t.size;
      volume += t.size;
    }
    if (volume <= 0) return null;
    let bestBid = Number.NEGATIVE_INFINITY;
    let bestAsk = Number.POSITIVE_INFINITY;
    for (const q of this.#quotes.get(symbol)?.values() ?? []) {
      bestBid = Math.max(bestBid, q.bid);
      bestAsk = Math.min(bestAsk, q.ask);
    }
    const spread = Number.isFinite(bestBid) && Number.isFinite(bestAsk) ? bestAsk - bestBid : 0;
    return { symbol, vwap: notional / volume, spread, volume, windowMs, ts: now };
  }
}
