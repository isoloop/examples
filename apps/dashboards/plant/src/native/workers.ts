// The page's side of the native + workers build: a data worker per machine,
// whose records go into the page's store, and the fleet worker, to which the
// page relays the machines' health records.
import { MACHINES } from '../core/machines';
import { of, type StreamName, type ValueOf } from '../core/streams';
import type { Settings } from '../url';
import type { FromWorker, ToWorker } from './protocol';
import { store } from './store';

const intoStore = (w: Worker): void => {
  w.addEventListener('message', (e: MessageEvent<FromWorker>) => {
    const { stream, key, value } = e.data;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the worker publishes `stream`'s records
    store.publish(stream, value as ValueOf<StreamName>, key);
  });
};

export function startWorkers(s: Settings): Worker[] {
  const machines = MACHINES.map((machine) => {
    const w = new Worker(new URL('./machine.worker.ts', import.meta.url), {
      type: 'module',
      name: `data-${machine}`,
    });
    intoStore(w);
    const start: ToWorker = { type: 'start', machine, seed: s.seed, rateKHz: s.rate };
    w.postMessage(start);
    return w;
  });
  const fleet = new Worker(new URL('./fleet.worker.ts', import.meta.url), {
    type: 'module',
    name: 'fleet',
  });
  intoStore(fleet);
  for (const m of MACHINES) {
    store.subscribe(
      of(m, 'health'),
      (r) => {
        const msg: ToWorker = { type: 'record', stream: of(m, 'health'), value: r.value };
        fleet.postMessage(msg);
      },
      'latest',
    );
  }
  return [...machines, fleet];
}
