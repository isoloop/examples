// The page's side of the native + workers build: a data worker per machine,
// whose records go into the page's store.
import { MACHINES } from '../core/machines';
import type { StreamName, ValueOf } from '../core/streams';
import type { Settings } from '../url';
import type { FromWorker, ToWorker } from './protocol';
import { store } from './store';

export function startWorkers(s: Settings): Worker[] {
  return MACHINES.map((machine) => {
    const w = new Worker(new URL('./machine.worker.ts', import.meta.url), {
      type: 'module',
      name: `data-${machine}`,
    });
    w.addEventListener('message', (e: MessageEvent<FromWorker>) => {
      const { stream, key, value } = e.data;
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the worker publishes `stream`'s records
      store.publish(stream, value as ValueOf<StreamName>, key);
    });
    const start: ToWorker = { type: 'start', machine, seed: s.seed, rateKHz: s.rate };
    w.postMessage(start);
    return w;
  });
}
