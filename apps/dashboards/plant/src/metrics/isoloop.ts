// The Isoloop-only figures: loop lag per worker from the isolates'
// heartbeats, bus throughput from `bus:metrics`, and the workers running
// (an own worker or a pool each count once).
import type { IsolateSnapshot, PoolSnapshot } from '@isoloop/host';
import { kernel } from '../isoloop/kernel';
import { busSource } from '../isoloop/source';
import { applyTotals, type ApplySeen } from './apply';
import type { BuildMetricsSource } from './types';

let busRecordsPerSec = 0;
kernel.on('bus:metrics', (m) => {
  busRecordsPerSec = m.topics.reduce((n, t) => n + t.recordsPerSec, 0);
});

// Main-thread time applying each surface's DOM changes, sampled once a
// second (`./apply`). Sampling every frame built a snapshot of every isolate
// 60 times a second, about 20 ms/s of main-thread time that only this build
// paid for (isoloop#165, docs/investigations/plant-cpu.md).
export const SAMPLE_MS = 1_000;
const applied = new Map<string, number>();
const seen = new Map<string, ApplySeen>();
setInterval(() => applyTotals(kernel.isolates(), seen, applied), SAMPLE_MS);

const host = busSource(kernel);

/** Workers running now: each pool once, each isolate outside a pool once. */
export function workerCount(
  isolates: readonly IsolateSnapshot[] = kernel.isolates(),
  pools: readonly PoolSnapshot[] = kernel.pools(),
): number {
  const own = isolates.filter((i) => i.pool === undefined && i.state !== 'stopped').length;
  return own + pools.filter((p) => p.running).length;
}

export const buildMetrics: BuildMetricsSource = {
  read: () => {
    // One snapshot per read, shared by both figures.
    const isolates = kernel.isolates();
    return {
      workerLagMs: Math.max(0, ...isolates.map((i) => i.lagMs)),
      busRecordsPerSec,
      workers: workerCount(isolates),
    };
  },
  states: () => Object.fromEntries(kernel.isolates().map((i) => [i.id, i.state])),
  timings: (fn) =>
    host.subscribe(
      'timings',
      (r) => {
        for (const t of r.value.items) fn(t);
      },
      'latest',
    ),
  applyMs: () => applied,
};
