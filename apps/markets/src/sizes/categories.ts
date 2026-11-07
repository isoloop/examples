// Every widget's category on two axes (M3c decision 4): what its data is, and
// what it draws on. Plain data, so tests and the metrics panel can read it.
import type { WidgetName } from '../widgets';

/** raw: records as they arrive; filtered: a view over filters.v1; aggregated: rolling
 * computations over one stream; combined: joins several streams. */
export const DATA_KINDS = ['raw', 'filtered', 'aggregated', 'combined'] as const;
export const OUTPUTS = ['canvas', 'dom'] as const;
export type DataKind = (typeof DATA_KINDS)[number];
export type Output = (typeof OUTPUTS)[number];

export interface Category {
  data: DataKind;
  output: Output;
}

export const CATEGORY: Record<WidgetName, Category> = {
  filters: { data: 'filtered', output: 'dom' },
  price: { data: 'raw', output: 'canvas' },
  spread: { data: 'aggregated', output: 'canvas' },
  volume: { data: 'aggregated', output: 'canvas' },
  trades: { data: 'raw', output: 'dom' },
  'alerts-panel': { data: 'combined', output: 'dom' },
  sparklines: { data: 'filtered', output: 'canvas' },
  vwap: { data: 'aggregated', output: 'canvas' },
  volatility: { data: 'aggregated', output: 'canvas' },
  'volume-profile': { data: 'aggregated', output: 'canvas' },
  correlations: { data: 'combined', output: 'canvas' },
  depth: { data: 'combined', output: 'canvas' },
  'order-flow': { data: 'aggregated', output: 'canvas' },
  'top-movers': { data: 'combined', output: 'dom' },
  arbitrage: { data: 'combined', output: 'dom' },
  tape: { data: 'filtered', output: 'dom' },
  summary: { data: 'aggregated', output: 'dom' },
};
