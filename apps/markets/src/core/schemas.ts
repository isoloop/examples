// The dashboard's records, as Zod schemas. Plain data and no Isoloop imports:
// the Isoloop build turns them into topics (src/isoloop/contracts.ts) and the
// native build uses the same types for its store.
import { z } from 'zod';

// No `new Function` fast path: the app's CSP has no 'unsafe-eval', and Zod
// would otherwise probe for it and log a CSP violation in every worker.
z.config({ jitless: true });

export const EXCHANGES = ['coinbase', 'kraken', 'bitstamp', 'okx'] as const;
/** Every symbol the replay can synthesize (M3c decision 5: 20 at Normal and Heavy). */
export const SYMBOLS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'XRP-USD',
  'ADA-USD',
  'DOGE-USD',
  'AVAX-USD',
  'DOT-USD',
  'LINK-USD',
  'LTC-USD',
  'BCH-USD',
  'UNI-USD',
  'ATOM-USD',
  'XLM-USD',
  'NEAR-USD',
  'APT-USD',
  'ARB-USD',
  'OP-USD',
  'FIL-USD',
  'AAVE-USD',
] as const;
/** The symbols the live feeds subscribe to, and the replay's first `n` at Lite. */
export const LIVE_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'] as const;

export const exchange = z.enum(EXCHANGES);
export const symbol = z.enum(SYMBOLS);
const price = z.number().positive();
const size = z.number().nonnegative();
const ts = z.number().int().nonnegative();

/** One trade on one exchange. */
export const trade = z.object({
  exchange,
  symbol,
  id: z.string().min(1),
  price,
  size,
  side: z.enum(['buy', 'sell']),
  ts,
});

/** The top of one exchange's order book: up to 20 levels a side, best first. */
const level = z.tuple([price, size]);
export const book = z.object({
  exchange,
  symbol,
  bids: z.array(level).max(20),
  asks: z.array(level).max(20),
  ts,
});

/** The latest price per exchange and symbol (compacted, key `exchange:symbol`). */
export const quote = z.object({ exchange, symbol, last: price, bid: price, ask: price, ts });

/** Cross-market figures for one symbol over a window. */
export const aggregate = z.object({
  symbol,
  vwap: price,
  /** Best ask minus best bid across exchanges; negative when markets cross. */
  spread: z.number(),
  volume: size,
  windowMs: z.number().int().positive(),
  ts,
});

export const metric = z.enum(['price', 'vwap', 'spread']);

/** An alert rule (compacted, key = id). `removed` deletes it. */
export const alertRule = z.discriminatedUnion('removed', [
  z.object({
    removed: z.literal(false),
    id: z.string().min(1),
    symbol,
    metric,
    op: z.enum(['above', 'below']),
    threshold: z.number(),
  }),
  z.object({ removed: z.literal(true), id: z.string().min(1) }),
]);

/** A rule that fired. */
export const alert = z.object({
  ruleId: z.string().min(1),
  symbol,
  metric,
  op: z.enum(['above', 'below']),
  threshold: z.number(),
  value: z.number(),
  ts,
});

/** Rolling statistics for one symbol across exchanges (M3c task 3). */
export const stats = z.object({
  symbol,
  vwap: z.number().nonnegative(),
  /** Standard deviation of 1-second log returns over the window. */
  volatility: z.number().nonnegative(),
  volume: size,
  trades: z.number().int().nonnegative(),
  lo: price,
  hi: price,
  /** Volume per price bucket between `lo` and `hi`. */
  profile: z.array(z.number().nonnegative()).max(64),
  windowMs: z.number().int().positive(),
  ts,
});

/** Correlation of 1-second returns between symbols over one horizon, row-major (M3c task 4). */
export const correlations = z.object({
  horizonMs: z.number().int().positive(),
  symbols: z.array(symbol).max(20),
  matrix: z.array(z.number().min(-1).max(1)).max(400),
  ts,
});

/** Consolidated book depth for one symbol: size per bucket out from the mid, best first (M3c task 5). */
export const depth = z.object({
  symbol,
  mid: price,
  /** Each bucket's width, as a fraction of the mid. */
  step: z.number().positive(),
  bids: z.array(size).max(64),
  asks: z.array(size).max(64),
  ts,
});

/** Time a widget or engine spent on its work in the last second, on its own thread (M3c task 10). */
export const timing = z.object({
  /** The slot, or `engine-<name>`. */
  slot: z.string().min(1),
  /** The widget's name, or `engine`. */
  widget: z.string().min(1),
  ms: z.number().nonnegative(),
  /** Times the widget rendered in that second (its header's updates/s); engines leave it out. */
  updates: z.number().int().nonnegative().optional(),
  ts,
});

/** Load from a widget's flood control (M3b task 14); nothing reads it. */
export const noise = z.object({ widget: z.string().min(1), n: z.number().int().nonnegative(), ts });

/** What every widget shows (compacted, key `current`). */
export const filters = z.object({
  symbols: z.array(symbol).min(1),
  exchanges: z.array(exchange).min(1),
  windowMs: z.number().int().positive(),
});

export type Exchange = z.infer<typeof exchange>;
export type Sym = z.infer<typeof symbol>;
export type Trade = z.infer<typeof trade>;
export type Book = z.infer<typeof book>;
export type Quote = z.infer<typeof quote>;
export type Aggregate = z.infer<typeof aggregate>;
export type Metric = z.infer<typeof metric>;
export type AlertRule = z.infer<typeof alertRule>;
export type Alert = z.infer<typeof alert>;
export type Filters = z.infer<typeof filters>;
export type Noise = z.infer<typeof noise>;
export type Stats = z.infer<typeof stats>;
export type Correlations = z.infer<typeof correlations>;
export type Depth = z.infer<typeof depth>;
export type Timing = z.infer<typeof timing>;
