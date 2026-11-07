// The metrics panel (M3b task 17), the same in every build. It runs on the
// main thread, which is the thread being compared. Isoloop-only figures show
// "n/a" on native; what Isoloop costs (bundle size, time to first data,
// memory) sits next to what it buys.
import { buildMetrics } from '#metrics';
import { useEffect, useState } from 'react';
import { startMainThreadMetrics, type MainThreadMetrics } from './main-thread';
import type { BuildMetrics } from './types';

const read = startMainThreadMetrics();

type Stats = { jsGzipBytes: number };
let stats: Stats | 'unavailable' | undefined;
void fetch('./build-stats.json')
  .then((r) => (r.ok ? (r.json() as Promise<unknown>) : null))
  .then((s) => {
    const n: unknown = s && typeof s === 'object' ? Reflect.get(s, 'jsGzipBytes') : undefined;
    stats = typeof n === 'number' ? { jsGzipBytes: n } : 'unavailable';
  })
  .catch(() => {
    stats = 'unavailable';
  });

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(0)} KB`;
const ms = (v: number | null, none = '—'): string => (v === null ? none : `${Math.round(v)} ms`);

export function MetricsPanel() {
  const [m, setM] = useState<{ main: MainThreadMetrics; build: BuildMetrics }>(() => ({
    main: read(),
    build: buildMetrics.read(),
  }));
  useEffect(() => {
    const id = setInterval(() => setM({ main: read(), build: buildMetrics.read() }), 500);
    return () => clearInterval(id);
  }, []);
  const { main, build } = m;
  const rows: [string, string, string][] = [
    ['fps', 'Main-thread fps', String(main.fps)],
    ['long-tasks', 'Long tasks (10 s)', String(main.longTasks)],
    ['input', 'Input latency (10 s)', ms(main.inputLatencyMs, 'no input yet')],
    [
      'worker-lag',
      'Worst worker loop lag',
      build.workerLagMs === null ? 'n/a' : ms(build.workerLagMs),
    ],
    [
      'bus',
      'Bus throughput',
      build.busRecordsPerSec === null ? 'n/a' : `${Math.round(build.busRecordsPerSec)} rec/s`,
    ],
    ['memory', 'Memory', typeof main.memory === 'number' ? kb(main.memory) : main.memory],
    ['first-data', 'Time to first data', ms(main.firstDataMs, 'waiting')],
    [
      'bundle',
      'JS, gzipped',
      stats === undefined
        ? 'loading'
        : stats === 'unavailable'
          ? 'unavailable'
          : kb(stats.jsGzipBytes),
    ],
  ];
  return (
    <aside className="metrics" aria-label="Metrics">
      <dl>
        {rows.map(([key, label, value]) => (
          <div key={key} data-metric={key}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
