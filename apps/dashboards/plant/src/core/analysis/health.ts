// A machine's health score and status from its latest readings.
import { SENSOR } from '../machines';
import type { Status } from '../schemas';

export interface Readings {
  running: boolean;
  vibRms: number;
  /** Amplitude at the bearing frequency, mm/s. */
  bearing: number;
  bearingTemp: number;
  exhaustTemp: number;
  pressure: number;
}

/** The sensors with limits, and each one's reading. */
export const LIMITED = {
  vib: (r: Readings) => r.vibRms,
  bearingTemp: (r: Readings) => r.bearingTemp,
  exhaustTemp: (r: Readings) => r.exhaustTemp,
  pressure: (r: Readings) => r.pressure,
} as const;
export type LimitedSensor = keyof typeof LIMITED;
export const LIMITED_SENSORS = [
  'vib',
  'bearingTemp',
  'exhaustTemp',
  'pressure',
] as const satisfies readonly LimitedSensor[];

export type Level = 'ok' | 'warn' | 'alarm';

const band = (limit: number, held: boolean): number => (held ? limit * 0.97 : limit);

/**
 * The level a reading is at, with a little hysteresis: once raised, a level
 * clears only 3% below its limit, so a reading near a limit doesn't flap.
 */
export function levelOf(sensor: LimitedSensor, value: number, prev: Level = 'ok'): Level {
  const { warn = Infinity, alarm = Infinity } = SENSOR[sensor];
  if (value >= band(alarm, prev === 'alarm')) return 'alarm';
  if (value >= band(warn, prev !== 'ok')) return 'warn';
  return 'ok';
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** 100 as new, down to 0, with the reasons worst first. */
export function score(r: Readings): { score: number; reasons: string[] } {
  const parts: [string, number][] = [
    ['vibration', 40 * clamp01((r.vibRms - 3) / 8)],
    ['bearing tone', 25 * clamp01((r.bearing - 1) / 6)],
    ['bearing temp', 20 * clamp01((r.bearingTemp - 75) / 20)],
    ['exhaust temp', 15 * clamp01((r.exhaustTemp - 480) / 80)],
  ];
  const lost = parts.reduce((n, [, p]) => n + p, 0);
  return {
    score: Math.round(100 - lost),
    reasons: parts
      .filter(([, p]) => p >= 1)
      .toSorted((a, b) => b[1] - a[1])
      .map(([name]) => name),
  };
}

export function statusOf(running: boolean, levels: readonly Level[]): Status {
  if (!running) return 'stopped';
  if (levels.includes('alarm')) return 'alarm';
  if (levels.includes('warn')) return 'warn';
  return 'ok';
}
