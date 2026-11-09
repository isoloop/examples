// The dashboard's streams by name, as the widgets and every build see them.
// The Isoloop build maps each to a topic (`T3.vib` to `plant.t3.vib`); the
// native builds to a slot in the page's store.
import { MACHINES, type MachineId } from './machines';
import type {
  Alarm,
  Cleared,
  Fleet,
  Health,
  Noise,
  PlantEvent,
  Scalars,
  Spectrum,
  Stats,
  Timing,
  VibChunk,
} from './schemas';

export interface MachineValues {
  vib: VibChunk;
  scalars: Scalars;
  spectrum: Spectrum;
  stats: Stats;
  health: Health;
}
export type MachineStream = keyof MachineValues;
export const MACHINE_STREAMS = ['vib', 'scalars', 'spectrum', 'stats', 'health'] as const;

export interface PlantValues {
  alarms: Alarm;
  events: PlantEvent;
  fleet: Fleet;
  timings: Timing;
  noise: Noise;
  cleared: Cleared;
}
export type PlantStream = keyof PlantValues;
export const PLANT_STREAMS = ['alarms', 'events', 'fleet', 'timings', 'noise', 'cleared'] as const;

export type StreamName = `${MachineId}.${MachineStream}` | PlantStream;

export type ValueOf<S extends StreamName> =
  S extends `${MachineId}.${infer K extends MachineStream}`
    ? MachineValues[K]
    : S extends PlantStream
      ? PlantValues[S]
      : never;

/** A machine's stream, e.g. `T3.vib`. */
export const of = <K extends MachineStream>(m: MachineId, k: K): `${MachineId}.${K}` => `${m}.${k}`;

export const STREAMS: readonly StreamName[] = [
  ...MACHINES.flatMap((m) => MACHINE_STREAMS.map((k) => of(m, k))),
  ...PLANT_STREAMS,
];

export interface Rec<T> {
  key?: string | undefined;
  value: T;
}

/** What a build gives the jobs and the widgets' hooks: records by stream, and publishing. */
export interface Source {
  subscribe<S extends StreamName>(
    stream: S,
    fn: (r: Rec<ValueOf<S>>) => void,
    from: 'earliest' | 'latest',
  ): () => void;
  publish<S extends StreamName>(stream: S, value: ValueOf<S>, key?: string): void;
}

export interface Stoppable {
  stop(): void;
}
