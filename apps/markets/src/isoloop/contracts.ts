// The dashboard's topics (ADR 0003). The bus worker imports this module by URL
// to validate; the host imports it for `contracts.list`; isolates import it for
// the topic refs. The schemas themselves are shared with the native build.
import { contracts, topic } from '@isoloop/bus';
import * as s from '../core/schemas';

export const trades = topic('trades.v1', {
  schema: s.trade,
  retention: { kind: 'last-n', n: 20_000 },
});

export const book = topic('book.v1', {
  schema: s.book,
  retention: { kind: 'last-n', n: 200 },
});

/** Keyed `exchange:symbol`. */
export const prices = topic('prices.v1', {
  schema: s.quote,
  retention: { kind: 'compacted' },
});

export const aggregates = topic('aggregates.v1', {
  schema: s.aggregate,
  retention: { kind: 'last-n', n: 2_000 },
});

/** Keyed by rule id; persistent, so rules survive a reload (M2b). */
export const alertRules = topic('alert-rules.v1', {
  schema: s.alertRule,
  retention: { kind: 'compacted' },
  durability: 'persistent',
});

export const alerts = topic('alerts.v1', {
  schema: s.alert,
  retention: { kind: 'last-n', n: 500 },
  durability: 'persistent',
});

/** Keyed `current`. */
export const filters = topic('filters.v1', {
  schema: s.filters,
  retention: { kind: 'compacted' },
});

/** The stress controls' flood: memory, the last 100. */
export const noise = topic('noise.v1', {
  schema: s.noise,
  retention: { kind: 'last-n', n: 100 },
});

/** The rolling-stats engine's output (M3c task 3): 20 symbols a second. */
export const stats = topic('stats.v1', {
  schema: s.stats,
  retention: { kind: 'last-n', n: 2_000 },
});

/** The correlations engine's output (M3c task 4): a matrix per horizon, once a second. */
export const correlations = topic('correlations.v1', {
  schema: s.correlations,
  retention: { kind: 'last-n', n: 30 },
});

export default contracts(
  trades,
  book,
  prices,
  aggregates,
  alertRules,
  alerts,
  filters,
  noise,
  stats,
  correlations,
);
