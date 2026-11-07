// Synthesized ticks: a seeded random walk per symbol, each exchange a little
// off the common price, trades at random intervals and a book update every
// 500 ms per exchange and symbol. Deterministic for a seed, and endless, so the
// demo and CI need no recordings (exchanges' terms rarely allow publishing
// recorded market data; M3b task 7).
import { EXCHANGES, SYMBOLS, type Book, type Exchange, type Sym, type Trade } from '../schemas';
import type { Tick } from './tick';

/** mulberry32: a small, fast, seeded PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE: Record<Sym, { price: number; tick: number; size: number }> = {
  'BTC-USD': { price: 100_000, tick: 0.01, size: 0.05 },
  'ETH-USD': { price: 3_200, tick: 0.01, size: 0.8 },
  'SOL-USD': { price: 180, tick: 0.001, size: 12 },
};

export interface SynthOptions {
  seed?: number;
  /** Trades per second per exchange and symbol, on average. */
  tradesPerSecond?: number;
  /** Stop after this long; endless by default. */
  durationMs?: number;
  /** Epoch ms of `t = 0`, for the records' `ts`. */
  startTs?: number;
  symbols?: readonly Sym[];
  exchanges?: readonly Exchange[];
}

const round = (v: number, step: number): number => Math.round(v / step) * step;

export function* synth(o: SynthOptions = {}): Generator<Tick> {
  const random = rng(o.seed ?? 1);
  const rate = o.tradesPerSecond ?? 2;
  const end = o.durationMs ?? Number.POSITIVE_INFINITY;
  const startTs = o.startTs ?? 1_762_500_000_000;
  const symbols = o.symbols ?? SYMBOLS;
  const exchanges = o.exchanges ?? EXCHANGES;

  const mid = new Map(symbols.map((s) => [s, BASE[s].price]));
  const offset = new Map<string, number>();
  type Stream = { exchange: Exchange; symbol: Sym; kind: 'trade' | 'book'; next: number };
  const streams: Stream[] = [];
  for (const exchange of exchanges) {
    for (const symbol of symbols) {
      offset.set(`${exchange}:${symbol}`, (random() - 0.5) * 4e-4);
      streams.push({ exchange, symbol, kind: 'trade', next: random() * (1000 / rate) });
      streams.push({ exchange, symbol, kind: 'book', next: random() * 500 });
    }
  }
  let walkedTo = 0;
  let seq = 0;

  for (;;) {
    let s = streams[0];
    for (const x of streams) if (s === undefined || x.next < s.next) s = x;
    if (s === undefined || s.next > end) return;
    const t = Math.round(s.next);

    // The common price walks once per 100 ms of recording time.
    while (walkedTo + 100 <= t) {
      walkedTo += 100;
      for (const [sym, p] of mid) mid.set(sym, p * (1 + (random() - 0.5) * 6e-4));
    }
    const base = BASE[s.symbol];
    const m =
      (mid.get(s.symbol) ?? base.price) * (1 + (offset.get(`${s.exchange}:${s.symbol}`) ?? 0));
    const half = m * 5e-5;

    if (s.kind === 'trade') {
      const side = random() < 0.5 ? 'buy' : 'sell';
      const rec: Trade = {
        exchange: s.exchange,
        symbol: s.symbol,
        id: `${s.exchange}-${++seq}`,
        price: round(side === 'buy' ? m + half : m - half, base.tick),
        size: round(base.size * -Math.log(1 - random()), 1e-6) || base.size,
        side,
        ts: startTs + t,
      };
      yield { t, kind: 'trade', rec };
      // Exponential gaps: a Poisson stream at `rate` per second.
      s.next += (-Math.log(1 - random()) * 1000) / rate;
    } else {
      const levels = 10;
      const bids: Book['bids'] = [];
      const asks: Book['asks'] = [];
      for (let i = 0; i < levels; i++) {
        const step = half * (1 + i);
        bids.push([round(m - step, base.tick), round(base.size * (1 + random() * 4), 1e-6)]);
        asks.push([round(m + step, base.tick), round(base.size * (1 + random() * 4), 1e-6)]);
      }
      yield {
        t,
        kind: 'book',
        rec: { exchange: s.exchange, symbol: s.symbol, bids, asks, ts: startTs + t },
      };
      s.next += 500;
    }
  }
}
