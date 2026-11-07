import { createKernel, type Kernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import hello from '../isolates/hello?isolate';
import replay from '../isolates/replay?isolate';
import list from './contracts';
import contractsUrl from './contracts?isolate';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

// The bus worker imports the contracts by URL; the host imports the same
// module for its list (ADR 0003, decision 4).
const kernel = createKernel({ contracts: { url: contractsUrl, list }, workers });
// The replay source: `?speed=10` plays the synthesized ticks at 10×.
const params = new URLSearchParams(location.search);
kernel.spawn({
  id: 'replay',
  src: replay,
  config: { speed: Number(params.get('speed')) || 1, seed: Number(params.get('seed')) || 1 },
  grants: { publish: ['trades.v1', 'book.v1'], subscribe: [] },
});
kernel.spawn({ id: 'hello', src: hello, surface: root, grants: { publish: [], subscribe: [] } });

declare global {
  interface Window {
    /** For the E2E suite. */
    kernel: Kernel;
  }
}
window.kernel = kernel;
