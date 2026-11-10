// The Isoloop-only figures: loop lag per worker from the isolates'
// heartbeats, bus throughput from `bus:metrics`, and the workers running
// (an own worker or a pool each count once).
import { kernel } from '../isoloop/kernel';
import { busSource } from '../isoloop/source';
import type { BuildMetricsSource } from './types';

let busRecordsPerSec = 0;
kernel.on('bus:metrics', (m) => {
  busRecordsPerSec = m.topics.reduce((n, t) => n + t.recordsPerSec, 0);
});

// Main-thread time applying each surface's DOM changes: the compositor
// reports the last frame's apply time per surface; a frame that applied a
// batch adds it.
const applied = new Map<string, number>();
const seen = new Map<string, number>();
const sample = (): void => {
  for (const i of kernel.isolates()) {
    const s = i.surface;
    if (!s) continue;
    if (s.applied !== seen.get(i.id)) {
      seen.set(i.id, s.applied);
      applied.set(i.id, (applied.get(i.id) ?? 0) + s.lastFrameMs);
    }
  }
  requestAnimationFrame(sample);
};
requestAnimationFrame(sample);

const host = busSource(kernel);

/** Workers running now: each pool once, each isolate outside a pool once. */
export function workerCount(): number {
  const own = kernel.isolates().filter((i) => i.pool === undefined && i.state !== 'stopped').length;
  return own + kernel.pools().filter((p) => p.running).length;
}

export const buildMetrics: BuildMetricsSource = {
  read: () => ({
    workerLagMs: Math.max(0, ...kernel.isolates().map((i) => i.lagMs)),
    busRecordsPerSec,
    workers: workerCount(),
  }),
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
