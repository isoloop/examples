import { createKernel, type Kernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import hello from '../isolates/hello?isolate';
import bitstamp from '../isolates/feeds/bitstamp?isolate';
import coinbase from '../isolates/feeds/coinbase?isolate';
import kraken from '../isolates/feeds/kraken?isolate';
import okx from '../isolates/feeds/okx?isolate';
import aggregator from '../isolates/aggregator?isolate';
import alertsIsolate from '../isolates/alerts?isolate';
import replay from '../isolates/replay?isolate';
import list from './contracts';
import contractsUrl from './contracts?isolate';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

// The bus worker imports the contracts by URL; the host imports the same
// module for its list (ADR 0003, decision 4).
const kernel = createKernel({ contracts: { url: contractsUrl, list }, workers });
// `?source=live` reads the exchanges' public feeds, one isolate each;
// otherwise the replay source plays synthesized ticks (`?speed=10` for 10×).
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
    config: { speed: Number(params.get('speed')) || 1, seed: Number(params.get('seed')) || 1 },
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
kernel.spawn({ id: 'hello', src: hello, surface: root, grants: { publish: [], subscribe: [] } });

declare global {
  interface Window {
    /** For the E2E suite. */
    kernel: Kernel;
  }
}
window.kernel = kernel;
