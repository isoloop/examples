// The Isoloop-only figures: loop lag per worker from the isolates' heartbeats,
// and bus throughput from `bus:metrics`.
import { kernel } from '../isoloop/kernel';
import type { BuildMetricsSource } from './types';

let busRecordsPerSec = 0;
kernel.on('bus:metrics', (m) => {
  busRecordsPerSec = m.topics.reduce((n, t) => n + t.recordsPerSec, 0);
});

export const buildMetrics: BuildMetricsSource = {
  read: () => ({
    workerLagMs: Math.max(0, ...kernel.isolates().map((i) => i.lagMs)),
    busRecordsPerSec,
  }),
  states: () => Object.fromEntries(kernel.isolates().map((i) => [i.id, i.state])),
};
