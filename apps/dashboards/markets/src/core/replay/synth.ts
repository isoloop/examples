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

/**
 * Per symbol: a starting price, its tick (at most a quarter of the synthesized spread) and typical trade size, its sector
 * (symbols in one sector move together), how strongly it follows the market,
 * and how busy it is relative to BTC (trades per second scale by `activity`).
 */
interface Profile {
  price: number;
  tick: number;
  size: number;
  sector: number;
  beta: number;
  activity: number;
}
const p = (
  price: number,
  tick: number,
  size: number,
  sector: number,
  beta: number,
  activity: number,
): Profile => ({ price, tick, size, sector, beta, activity });

export const PROFILES: Record<Sym, Profile> = {
  'BTC-USD': p(100_000, 0.01, 0.05, 0, 1, 1),
  'ETH-USD': p(3_200, 0.01, 0.8, 0, 1.1, 0.8),
  'SOL-USD': p(180, 0.001, 12, 1, 1.4, 0.6),
  'XRP-USD': p(2.4, 0.00001, 900, 2, 1.2, 0.5),
  'ADA-USD': p(0.9, 0.00001, 2_000, 1, 1.3, 0.3),
  'DOGE-USD': p(0.35, 0.000001, 6_000, 3, 1.6, 0.5),
  'AVAX-USD': p(38, 0.0001, 50, 1, 1.4, 0.3),
  'DOT-USD': p(7.5, 0.0001, 250, 1, 1.3, 0.25),
  'LINK-USD': p(22, 0.0001, 90, 2, 1.2, 0.3),
  'LTC-USD': p(110, 0.001, 18, 0, 0.9, 0.3),
  'BCH-USD': p(480, 0.01, 4, 0, 0.9, 0.2),
  'UNI-USD': p(12, 0.0001, 160, 2, 1.3, 0.2),
  'ATOM-USD': p(9, 0.0001, 220, 1, 1.2, 0.2),
  'XLM-USD': p(0.45, 0.000001, 4_500, 2, 1.1, 0.2),
  'NEAR-USD': p(6, 0.0001, 330, 1, 1.4, 0.2),
  'APT-USD': p(11, 0.0001, 180, 1, 1.5, 0.2),
  'ARB-USD': p(1.1, 0.00001, 1_800, 2, 1.4, 0.2),
  'OP-USD': p(2.3, 0.00001, 900, 2, 1.4, 0.2),
  'FIL-USD': p(5.5, 0.0001, 360, 3, 1.3, 0.15),
  'AAVE-USD': p(260, 0.001, 8, 2, 1.2, 0.15),
};
const SECTORS = 4;

export interface SynthOptions {
  seed?: number;
  /** Trades per second per exchange for BTC, on average; other symbols scale by their activity. */
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

  const mid = new Map(symbols.map((s) => [s, PROFILES[s].price]));
  const offset = new Map<string, number>();
  type Stream = {
    exchange: Exchange;
    symbol: Sym;
    kind: 'trade' | 'book';
    rate?: number;
    next: number;
  };
  const streams: Stream[] = [];
  for (const exchange of exchanges) {
    for (const symbol of symbols) {
      offset.set(`${exchange}:${symbol}`, (random() - 0.5) * 4e-4);
      const r = rate * PROFILES[symbol].activity;
      streams.push({ exchange, symbol, kind: 'trade', rate: r, next: random() * (1000 / r) });
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

    // Prices walk once per 100 ms of recording time: a market move, a move per
    // sector, and each symbol's own, so symbols in a sector are correlated.
    while (walkedTo + 100 <= t) {
      walkedTo += 100;
      const market = random() - 0.5;
      const sector = Array.from({ length: SECTORS }, () => random() - 0.5);
      for (const [sym, price] of mid) {
        const pr = PROFILES[sym];
        const move =
          pr.beta * (0.5 * market + 0.8 * (sector[pr.sector] ?? 0)) + 0.6 * (random() - 0.5);
        mid.set(sym, price * (1 + move * 4e-4));
      }
    }
    const base = PROFILES[s.symbol];
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
      s.next += (-Math.log(1 - random()) * 1000) / (s.rate ?? rate);
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
