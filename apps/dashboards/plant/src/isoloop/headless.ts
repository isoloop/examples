// The headless isolates (M3d tasks 2 and 3): per machine its feed and its FFT,
// stats and health engines; plant-wide the fleet engine. Each with the topics
// it may use (I4).
import type { Grants } from '@isoloop/protocol';
import { MACHINES, type MachineId } from '../core/machines';
import { of, type StreamName } from '../core/streams';
import fft from '../isolates/fft?isolate';
import feed from '../isolates/feed?isolate';
import fleet from '../isolates/fleet?isolate';
import health from '../isolates/health?isolate';
import stats from '../isolates/stats?isolate';
import { topicName } from './names';

export type JobKind = 'feed' | 'fft' | 'stats' | 'health' | 'fleet';

export interface Job {
  id: string;
  kind: JobKind;
  machine?: MachineId;
  src: string;
  grants: Grants;
  config?: unknown;
}

const t = (...xs: StreamName[]): string[] => xs.map(topicName);
const TIMINGS = topicName('timings');

function machineJobs(m: MachineId, seed: number, rateKHz: number): Job[] {
  const config = { machine: m, seed, rateKHz };
  const job = (kind: JobKind, src: string, grants: Grants): Job => ({
    id: `${kind}-${m}`,
    kind,
    machine: m,
    src,
    grants,
    config,
  });
  return [
    job('feed', feed, { publish: t(of(m, 'vib'), of(m, 'scalars')), subscribe: [] }),
    job('fft', fft, {
      publish: [...t(of(m, 'spectrum')), TIMINGS],
      subscribe: t(of(m, 'vib')),
    }),
    job('stats', stats, {
      publish: [...t(of(m, 'stats')), TIMINGS],
      subscribe: t(of(m, 'scalars'), of(m, 'spectrum')),
    }),
    job('health', health, {
      publish: [...t(of(m, 'health'), 'alarms', 'events'), TIMINGS],
      subscribe: t(of(m, 'health'), of(m, 'scalars'), of(m, 'spectrum')),
    }),
  ];
}

export function headlessJobs(seed: number, rateKHz: number): Job[] {
  return [
    ...MACHINES.flatMap((m) => machineJobs(m, seed, rateKHz)),
    {
      id: 'fleet',
      kind: 'fleet',
      src: fleet,
      grants: { publish: [topicName('fleet'), TIMINGS], subscribe: ['plant.*.health'] },
    },
  ];
}
