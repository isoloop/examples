// The signals (M3d decision 3), as pure functions of the seed, the machine and
// the time: plausible, seeded and the same in every build.
//
// - Vibration (mm/s): the shaft frequency and two harmonics, a bearing tone
//   that grows with bearing wear, and noise; near zero while tripped.
// - Slow sensors: speed, power and pressure follow a slow load cycle;
//   temperatures follow the load and the faults.
import { MACHINES, type MachineId } from '../machines';
import type { Scalars, VibChunk } from '../schemas';
import { faultAt, progress } from './faults';
import { gauss, hash01 } from './rng';

/** One vibration chunk per machine every 50 ms, at any rate (decision 4). */
export const CHUNK_MS = 50;
/** One row of slow signals per machine every 200 ms. */
export const SCALARS_MS = 200;
/** Bearing defect frequency, as a multiple of the shaft frequency. */
export const BEARING_ORDER = 3.57;

export interface MachineParams {
  rpm: number;
  power: number;
  pressure: number;
  bearingTemp: number;
  exhaustTemp: number;
  /** Phase of the load cycle, radians. */
  phase: number;
}

const LOAD_PERIOD_MS = 300_000;

export function params(seed: number, machine: MachineId): MachineParams {
  const i = MACHINES.indexOf(machine);
  const r = (k: number): number => hash01(seed, i, k);
  return {
    rpm: 1_500 + 300 * Math.floor(r(1) * 6),
    power: 300 + 400 * r(2),
    pressure: 5 + 2 * r(3),
    bearingTemp: 58 + 8 * r(4),
    exhaustTemp: 380 + 60 * r(5),
    phase: 2 * Math.PI * r(6),
  };
}

/** The load, about 0.65 to 0.95, on a 5-minute cycle. */
export function load(p: MachineParams, ts: number): number {
  return 0.8 + 0.15 * Math.sin((2 * Math.PI * ts) / LOAD_PERIOD_MS + p.phase);
}

/** The row of slow signals at `ts`. */
export function scalarsAt(seed: number, machine: MachineId, ts: number): Scalars {
  const p = params(seed, machine);
  const i = MACHINES.indexOf(machine);
  const n = Math.floor(ts / SCALARS_MS);
  const noise = (k: number, sd: number): number => sd * gauss(seed, i, n, 100 + k);
  const f = faultAt(seed, machine, ts);
  const x = f ? progress(f, ts) : 0;
  const L = load(p, ts);
  const tripped = f?.kind === 'trip';
  const bearingFault = f?.kind === 'bearing-wear' ? 22 * x : 0;
  const overheat = f?.kind === 'overheat' ? x : 0;
  return {
    machine,
    ts,
    speed: tripped ? 0 : p.rpm * (0.98 + 0.02 * L) + noise(1, 2),
    power: tripped ? 0 : p.power * L + noise(2, 4),
    pressure: tripped ? 1 + noise(3, 0.02) : p.pressure * (0.9 + 0.1 * L) + noise(3, 0.05),
    bearingTemp: p.bearingTemp + 10 * L + bearingFault + 38 * overheat + noise(4, 0.3),
    exhaustTemp: p.exhaustTemp + 60 * L + 200 * overheat + noise(5, 2),
    running: !tripped,
  };
}

/** Samples per chunk at `rateKHz`. */
export const samplesPerChunk = (rateKHz: number): number => CHUNK_MS * rateKHz;

/** The vibration chunk starting at `index * CHUNK_MS`. */
export function vibChunk(
  seed: number,
  machine: MachineId,
  rateKHz: number,
  index: number,
): VibChunk {
  const p = params(seed, machine);
  const i = MACHINES.indexOf(machine);
  const t0 = index * CHUNK_MS;
  const n = samplesPerChunk(rateKHz);
  const dtMs = 1 / rateKHz;
  const f = faultAt(seed, machine, t0);
  const gain = f?.kind === 'trip' ? 0.02 : 1;
  const wear = f?.kind === 'bearing-wear' ? 10 * progress(f, t0) : 0.3;
  const f0 = p.rpm / 60;
  const fb = f0 * BEARING_ORDER;
  const values = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    // Seconds within the hour: keeps the phase exact in float64 and the
    // signal continuous across chunks.
    const t = ((t0 + k * dtMs) % 3_600_000) / 1000;
    const shaft = Math.sin(2 * Math.PI * f0 * t);
    const v =
      2.2 * shaft +
      0.9 * Math.sin(2 * Math.PI * 2 * f0 * t + 0.7) +
      0.4 * Math.sin(2 * Math.PI * 3 * f0 * t + 1.9) +
      wear * Math.sin(2 * Math.PI * fb * t) * (1 + 0.4 * shaft) +
      0.35 * gauss(seed, i, index, k);
    values[k] = gain * v;
  }
  return { machine, sensor: 'vib', t0, dtMs, values };
}
