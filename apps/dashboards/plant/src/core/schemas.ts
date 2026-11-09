// The dashboard's record shapes, shared by every build. The Isoloop build's
// topics validate with them (isoloop/contracts.ts); the native builds use the
// types.
import { z } from 'zod';
import { MACHINES } from './machines';

const machine = z.enum(MACHINES);

/**
 * Fast signals (M3d decision 4): one record per machine per 50 ms at any rate,
 * the samples as a Float32Array (50 at 1 kHz, 250 at 5 kHz).
 */
export const vibChunk = z.object({
  machine,
  sensor: z.literal('vib'),
  /** Time of the first sample, ms since the epoch. */
  t0: z.number(),
  /** Time between samples, ms. */
  dtMs: z.number(),
  values: z.instanceof(Float32Array),
});
export type VibChunk = z.infer<typeof vibChunk>;

/** Slow signals: one row per machine every 200 ms with every slow sensor. */
export const scalars = z.object({
  machine,
  ts: z.number(),
  speed: z.number(),
  power: z.number(),
  pressure: z.number(),
  bearingTemp: z.number(),
  exhaustTemp: z.number(),
  running: z.boolean(),
});
export type Scalars = z.infer<typeof scalars>;

/** The FFT engine's output: a 1024-sample Hann window, every 256 samples. */
export const spectrum = z.object({
  machine,
  ts: z.number(),
  /** Width of a bin, Hz. */
  binHz: z.number(),
  /** Magnitude per bin, mm/s, from 0 Hz up to half the sampling rate. */
  mags: z.instanceof(Float32Array),
  peakHz: z.number(),
  peak: z.number(),
  /** RMS of the window, mm/s. */
  rms: z.number(),
});
export type Spectrum = z.infer<typeof spectrum>;

const summary = z.object({
  last: z.number(),
  min: z.number(),
  max: z.number(),
  p50: z.number(),
  p95: z.number(),
  p99: z.number(),
});
export type Summary = z.infer<typeof summary>;

/** The stats engine's output, once a second: each sensor over the last 60 s. */
export const stats = z.object({
  machine,
  ts: z.number(),
  windowMs: z.number(),
  sensors: z.record(z.string(), summary),
});
export type Stats = z.infer<typeof stats>;

export const STATUSES = ['ok', 'warn', 'alarm', 'stopped'] as const;
export type Status = (typeof STATUSES)[number];

/** The health engine's output, once a second. */
export const health = z.object({
  machine,
  ts: z.number(),
  /** 0 (failing) to 100 (as new). */
  score: z.number(),
  status: z.enum(STATUSES),
  vibRms: z.number(),
  /** Amplitude at the bearing frequency, mm/s. */
  bearing: z.number(),
  bearingTemp: z.number(),
  exhaustTemp: z.number(),
  power: z.number(),
  speed: z.number(),
  /** What lowers the score, worst first. */
  reasons: z.array(z.string()),
});
export type Health = z.infer<typeof health>;

/** A limit crossed or cleared, from the health engine. Persistent (M2b). */
export const alarm = z.object({
  id: z.string(),
  machine,
  sensor: z.string(),
  level: z.enum(['warn', 'alarm']),
  state: z.enum(['active', 'cleared']),
  value: z.number(),
  limit: z.number(),
  ts: z.number(),
});
export type Alarm = z.infer<typeof alarm>;

export const EVENT_KINDS = ['start', 'stop', 'alarm', 'clear', 'fault'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** What happened on a machine, for the event log. Persistent (M2b). */
export const event = z.object({
  id: z.string(),
  machine,
  kind: z.enum(EVENT_KINDS),
  text: z.string(),
  ts: z.number(),
});
export type PlantEvent = z.infer<typeof event>;

/** The fleet engine's output, once a second, from the derived topics only. */
export const fleet = z.object({
  ts: z.number(),
  totalPower: z.number(),
  meanHealth: z.number(),
  machines: z.array(
    z.object({
      machine,
      status: z.enum(STATUSES),
      score: z.number(),
      power: z.number(),
      bearingTemp: z.number(),
      /** How far from the fleet this machine is, in standard deviations. */
      anomaly: z.number(),
      /** Share of the plant's power. */
      load: z.number(),
    }),
  ),
  /** Pearson correlation of the machines' vibration RMS over the last 60 s, row-major 8×8. */
  correlation: z.array(z.number()),
});
export type Fleet = z.infer<typeof fleet>;

/** The stress controls' flood: memory, the last 100. */
export const noise = z.object({ widget: z.string(), n: z.number(), ts: z.number() });
export type Noise = z.infer<typeof noise>;

/** "Clear history": records before `ts` are hidden. Keyed by stream (`alarms`, `events`). */
export const cleared = z.object({ ts: z.number() });
export type Cleared = z.infer<typeof cleared>;

/** Time per widget and engine, once a second each (as in the markets app). */
export const timing = z.object({
  slot: z.string(),
  widget: z.string(),
  ms: z.number(),
  /** Renders committed in the last second. */
  updates: z.number().optional(),
  /** Canvas draws in the last second. */
  draws: z.number().optional(),
  ts: z.number(),
});
export type Timing = z.infer<typeof timing>;
