// The dashboard's streams by name, as the widgets and both builds see them.
// The Isoloop build maps each to a topic; the native build to a store slot.
import type {
  Aggregate,
  Alert,
  AlertRule,
  Book,
  Correlations,
  Depth,
  Filters,
  Noise,
  Quote,
  Stats,
  Timing,
  Trade,
} from './schemas';

export interface Streams {
  trades: Trade;
  book: Book;
  prices: Quote;
  aggregates: Aggregate;
  alertRules: AlertRule;
  alerts: Alert;
  filters: Filters;
  noise: Noise;
  stats: Stats;
  correlations: Correlations;
  depth: Depth;
  timings: Timing;
}
export type StreamName = keyof Streams;

export interface Rec<T> {
  key?: string | undefined;
  value: T;
}

/** What a build gives the widgets' hooks: records by stream, and publishing. */
export interface Source {
  subscribe<S extends StreamName>(
    stream: S,
    fn: (r: Rec<Streams[S]>) => void,
    from: 'earliest' | 'latest',
  ): () => void;
  publish<S extends StreamName>(stream: S, value: Streams[S], key?: string): void;
}

export const DEFAULT_FILTERS: Filters = {
  symbols: ['BTC-USD'],
  exchanges: ['coinbase', 'kraken', 'bitstamp', 'okx'],
  windowMs: 60_000,
};
