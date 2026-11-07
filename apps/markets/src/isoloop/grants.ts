// The topics each widget isolate may use (I4), whichever framework it runs on.
import type { WidgetName } from '../widgets';

export interface Grants {
  publish: string[];
  subscribe: string[];
}

export const GRANTS: Record<WidgetName, Grants> = {
  filters: { publish: ['filters.v1', 'noise.v1'], subscribe: ['filters.v1'] },
  price: { publish: ['noise.v1'], subscribe: ['prices.v1', 'filters.v1'] },
  spread: { publish: ['noise.v1'], subscribe: ['aggregates.v1', 'filters.v1'] },
  volume: { publish: ['noise.v1'], subscribe: ['aggregates.v1', 'filters.v1'] },
  trades: { publish: ['noise.v1'], subscribe: ['trades.v1', 'filters.v1'] },
  'alerts-panel': {
    publish: ['alert-rules.v1', 'noise.v1'],
    subscribe: ['alert-rules.v1', 'alerts.v1'],
  },
  sparklines: { publish: ['noise.v1'], subscribe: ['prices.v1', 'filters.v1'] },
  vwap: { publish: ['noise.v1'], subscribe: ['stats.v1', 'filters.v1'] },
  volatility: { publish: ['noise.v1'], subscribe: ['stats.v1'] },
  'volume-profile': { publish: ['noise.v1'], subscribe: ['stats.v1', 'filters.v1'] },
  correlations: { publish: ['noise.v1'], subscribe: ['correlations.v1'] },
  depth: { publish: ['noise.v1'], subscribe: ['depth.v1', 'filters.v1'] },
  'top-movers': { publish: ['noise.v1'], subscribe: ['prices.v1', 'stats.v1', 'alerts.v1'] },
  arbitrage: { publish: ['noise.v1'], subscribe: ['prices.v1', 'stats.v1'] },
  tape: { publish: ['noise.v1'], subscribe: ['trades.v1', 'filters.v1'] },
  summary: { publish: ['noise.v1'], subscribe: ['stats.v1'] },
};
