// Each widget as an isolate: its module URL and the topics it may use (I4).
import alerts from '../isolates/widgets/alerts?isolate';
import filters from '../isolates/widgets/filters?isolate';
import price from '../isolates/widgets/price?isolate';
import spread from '../isolates/widgets/spread?isolate';
import trades from '../isolates/widgets/trades?isolate';
import volume from '../isolates/widgets/volume?isolate';
import type { WidgetName } from '../widgets';

interface Grants {
  publish: string[];
  subscribe: string[];
}

export const ISOLATES: Record<WidgetName, { src: string; grants: Grants }> = {
  filters: { src: filters, grants: { publish: ['filters.v1'], subscribe: ['filters.v1'] } },
  price: { src: price, grants: { publish: [], subscribe: ['prices.v1', 'filters.v1'] } },
  spread: { src: spread, grants: { publish: [], subscribe: ['aggregates.v1', 'filters.v1'] } },
  volume: { src: volume, grants: { publish: [], subscribe: ['aggregates.v1', 'filters.v1'] } },
  trades: { src: trades, grants: { publish: [], subscribe: ['trades.v1', 'filters.v1'] } },
  'alerts-panel': {
    src: alerts,
    grants: { publish: ['alert-rules.v1'], subscribe: ['alert-rules.v1', 'alerts.v1'] },
  },
};
