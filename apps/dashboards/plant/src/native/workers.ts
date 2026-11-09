// The page's side of the native + workers build (M3d decision 7, task 8): a
// data worker per machine, whose records go into the page's store, and the
// fleet worker, to which the page relays the machines' health records. Plain
// `postMessage`, as a careful team would write it without Isoloop: a worker
// that errors is replaced, and its machine's data picks up where the clock is.
import { MACHINES, type MachineId } from '../core/machines';
import { of, type StreamName, type ValueOf } from '../core/streams';
import type { Settings } from '../url';
import type { FromWorker, ToWorker } from './protocol';
import { running } from './running';
import { store } from './store';

/** Vite bundles a worker only from `new Worker(new URL(...))` written out in full. */
const MAKE = {
  machine: (name: string) =>
    new Worker(new URL('./machine.worker.ts', import.meta.url), { type: 'module', name }),
  fleet: (name: string) =>
    new Worker(new URL('./fleet.worker.ts', import.meta.url), { type: 'module', name }),
};

function start(name: string, kind: keyof typeof MAKE, init: (w: Worker) => void): void {
  const w = MAKE[kind](name);
  w.addEventListener('message', (e: MessageEvent<FromWorker>) => {
    const { stream, key, value } = e.data;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the worker publishes `stream`'s records
    store.publish(stream, value as ValueOf<StreamName>, key);
  });
  w.addEventListener('error', () => {
    w.terminate();
    running.delete(name);
    setTimeout(() => {
      start(name, kind, init);
    }, 250);
  });
  running.set(name, w);
  init(w);
}

/** The machine's health records, to the fleet worker. */
function relay(m: MachineId): void {
  store.subscribe(
    of(m, 'health'),
    (r) => {
      const msg: ToWorker = { type: 'record', stream: of(m, 'health'), value: r.value };
      running.get('fleet')?.postMessage(msg);
    },
    'latest',
  );
}

export function startWorkers(s: Settings): void {
  for (const machine of MACHINES) {
    start(`data-${machine}`, 'machine', (w) => {
      const msg: ToWorker = { type: 'start', machine, seed: s.seed, rateKHz: s.rate };
      w.postMessage(msg);
    });
  }
  start('fleet', 'fleet', () => {});
  for (const m of MACHINES) relay(m);
}
