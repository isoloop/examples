// Native has no workers and no bus: those figures are "n/a". Widgets'
// timings come from the page's store; their work is all on the main thread.
import { store } from '../native/store';
import type { BuildMetricsSource } from './types';

export const buildMetrics: BuildMetricsSource = {
  read: () => ({ workerLagMs: null, busRecordsPerSec: null }),
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
