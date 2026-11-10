// Both native builds have no isolates and no bus: those figures are "n/a".
// Widgets' timings come from the page's store; their work is all on the main
// thread. The native + workers build counts its data workers.
import { store } from '../native/store';
import { running } from '../native/running';
import type { BuildMetricsSource } from './types';

export const buildMetrics: BuildMetricsSource = {
  read: () => ({
    workerLagMs: null,
    busRecordsPerSec: null,
    workers: running.size,
  }),
  states: () => null,
  timings: (fn) =>
    store.subscribe(
      'timings',
      (r) => {
        for (const t of r.value.items) fn(t);
      },
      'latest',
    ),
  applyMs: () => null,
};
