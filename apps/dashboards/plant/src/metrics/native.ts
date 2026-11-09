// Both native builds have no isolates and no bus: those figures are "n/a".
// Widgets' timings come from the page's store; their work is all on the main
// thread. The native + workers build counts its data workers.
import { store } from '../native/store';
import type { BuildMetricsSource } from './types';

export const buildMetrics: BuildMetricsSource = {
  read: () => ({
    workerLagMs: null,
    busRecordsPerSec: null,
    workers: import.meta.env.PLANT_BUILD === 'native-workers' ? 9 : 0,
  }),
  states: () => null,
  timings: (fn) =>
    store.subscribe(
      'timings',
      (r) => {
        fn(r.value);
      },
      'latest',
    ),
  applyMs: () => null,
};
