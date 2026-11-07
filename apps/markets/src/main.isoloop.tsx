import { createRoot } from 'react-dom/client';
import aggregator from './isolates/aggregator?isolate';
import alertsIsolate from './isolates/alerts?isolate';
import bitstamp from './isolates/feeds/bitstamp?isolate';
import coinbase from './isolates/feeds/coinbase?isolate';
import kraken from './isolates/feeds/kraken?isolate';
import okx from './isolates/feeds/okx?isolate';
import replay from './isolates/replay?isolate';
import { kernel } from './isoloop/kernel';
import { Page } from './page';
import './page.css';

declare global {
  interface Window {
    /** For the E2E suite. */
    kernel: typeof kernel;
  }
}
window.kernel = kernel;

// The headless pipeline: a feed isolate per exchange (`?source=live`) or the
// replay source (`?speed=10` for 10×), then the aggregator and the alerts.
const params = new URLSearchParams(location.search);
const feedGrants = { publish: ['trades.v1', 'book.v1', 'prices.v1'], subscribe: [] };
if (params.get('source') === 'live') {
  for (const [name, src] of Object.entries({ coinbase, kraken, bitstamp, okx })) {
    kernel.spawn({ id: `feed-${name}`, src, grants: feedGrants });
  }
} else {
  kernel.spawn({
    id: 'replay',
    src: replay,
    config: {
      speed: Number(params.get('speed')) || 1,
      seed: Number(params.get('seed')) || 1,
      tradesPerSecond: Number(params.get('tps')) || 2,
      ...(params.has('for') ? { durationMs: Number(params.get('for')) } : {}),
    },
    grants: feedGrants,
  });
}
kernel.spawn({
  id: 'aggregator',
  src: aggregator,
  grants: { publish: ['aggregates.v1'], subscribe: ['trades.v1', 'prices.v1', 'filters.v1'] },
});
kernel.spawn({
  id: 'alerts',
  src: alertsIsolate,
  grants: {
    publish: ['alerts.v1'],
    subscribe: ['alert-rules.v1', 'alerts.v1', 'prices.v1', 'aggregates.v1'],
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
