import { createRoot } from 'react-dom/client';
import aggregator from './isolates/aggregator?isolate';
import alertsIsolate from './isolates/alerts?isolate';
import bitstamp from './isolates/feeds/bitstamp?isolate';
import coinbase from './isolates/feeds/coinbase?isolate';
import kraken from './isolates/feeds/kraken?isolate';
import okx from './isolates/feeds/okx?isolate';
import replay from './isolates/replay?isolate';
import { filters as filtersTopic } from './isoloop/contracts';
import { kernel } from './isoloop/kernel';
import { Page } from './page';
import { replayFor } from './sizes/sizes';
import { filtersFrom, startReplayClock, writeFilters } from './url';
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
  const config = replayFor(params);
  kernel.spawn({ id: 'replay', src: replay, config, grants: feedGrants });
  startReplayClock(config);
}
// Filters from the URL (after a switch), and back into it as they change.
const initial = filtersFrom(params);
if (initial) void kernel.publish(filtersTopic, { key: 'current', value: initial });
kernel.subscribe(
  filtersTopic,
  (r) => {
    writeFilters(r.value);
  },
  { from: 'latest' },
);
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
