// How long each stream keeps its records (M3d decision 5), in every build:
// the Isoloop build's topics and the native builds' store read this.
import type { MachineStream, PlantStream } from './streams';

export type Keep = { kind: 'time'; ms: number } | { kind: 'last-n'; n: number } | { kind: 'keyed' };

/** The temperature trend's window: two minutes of slow-signal rows. */
export const TREND_MS = 120_000;

/**
 * How much slow-signal and health history is kept: the longest window any
 * consumer reads back on start. The trend reads 2 minutes of `scalars`, the
 * stats engine 60 s, and the fleet engine 2 minutes of `health`
 * (retention.test.ts checks this against each of them). Keeping more only
 * makes a restart replay more (docs/investigations/plant-one-pool.md in the
 * main repo: 5 minutes delayed spectra by about 2 s after a restart in `one`).
 */
export const SLOW_KEEP_MS = 120_000;

export const MACHINE_KEEP: Record<MachineStream, Keep> = {
  // The last 30 s of raw vibration: about 1 MB plant-wide at 1 kHz.
  vib: { kind: 'time', ms: 30_000 },
  scalars: { kind: 'time', ms: SLOW_KEEP_MS },
  spectrum: { kind: 'time', ms: 30_000 },
  stats: { kind: 'last-n', n: 60 },
  health: { kind: 'time', ms: SLOW_KEEP_MS },
};

/** Alarms and events: persistent, capped at 10,000 records each, oldest dropped. */
export const HISTORY_CAP = 10_000;

export const PLANT_KEEP: Record<PlantStream, Keep> = {
  alarms: { kind: 'last-n', n: HISTORY_CAP },
  events: { kind: 'last-n', n: HISTORY_CAP },
  fleet: { kind: 'last-n', n: 300 },
  timings: { kind: 'last-n', n: 1_000 },
  noise: { kind: 'last-n', n: 100 },
  cleared: { kind: 'keyed' },
};

/** Kept across a reload: OPFS on Isoloop, localStorage on native. */
export const PERSISTENT: readonly PlantStream[] = ['alarms', 'events', 'cleared'];

export const isPersistent = (s: string): s is PlantStream =>
  (PERSISTENT as readonly string[]).includes(s);

/** The time a record carries, for time-based retention. */
export function timeOf(value: unknown): number {
  if (typeof value !== 'object' || value === null) return 0;
  const ts: unknown = Reflect.get(value, 'ts') ?? Reflect.get(value, 't0');
  return typeof ts === 'number' ? ts : 0;
}
