// The fault schedule (M3d decision 3): a pure function of the seed, the machine
// and the time, so every build injects the same faults at the same moments.
//
// Time is cut into cycles of 3 minutes. In each cycle a machine has a fault or
// not (even odds), starting 10 to 120 s in: bearing wear (the bearing tone
// grows and the bearing warms), overheating (both temperatures climb past
// their alarm limits) or a trip (the machine stops, then starts again).
import { MACHINES, type MachineId } from '../machines';
import { hash01 } from './rng';

export const CYCLE_MS = 180_000;

export const FAULT_KINDS = ['bearing-wear', 'overheat', 'trip'] as const;
export type FaultKind = (typeof FAULT_KINDS)[number];

export const FAULT_MS: Record<FaultKind, number> = {
  'bearing-wear': 45_000,
  overheat: 40_000,
  trip: 20_000,
};

export interface Fault {
  machine: MachineId;
  kind: FaultKind;
  start: number;
  end: number;
}

const index = (m: MachineId): number => MACHINES.indexOf(m);

/** The machine's fault in cycle `c` (the cycle starting at `c * CYCLE_MS`), if any. */
export function faultInCycle(seed: number, machine: MachineId, c: number): Fault | null {
  const i = index(machine);
  if (hash01(seed, i, c, 11) < 0.5) return null;
  const kind = FAULT_KINDS[Math.floor(hash01(seed, i, c, 12) * FAULT_KINDS.length)] ?? 'trip';
  const start = c * CYCLE_MS + 10_000 + Math.floor(hash01(seed, i, c, 13) * 110_000);
  return { machine, kind, start, end: start + FAULT_MS[kind] };
}

/** The fault the machine has at `ts`, if any. */
export function faultAt(seed: number, machine: MachineId, ts: number): Fault | null {
  const f = faultInCycle(seed, machine, Math.floor(ts / CYCLE_MS));
  return f && ts >= f.start && ts < f.end ? f : null;
}

/** Every fault starting in [from, to), in start order. */
export function faultsBetween(seed: number, from: number, to: number): Fault[] {
  const out: Fault[] = [];
  for (let c = Math.floor(from / CYCLE_MS); c * CYCLE_MS < to; c++) {
    for (const m of MACHINES) {
      const f = faultInCycle(seed, m, c);
      if (f && f.start >= from && f.start < to) out.push(f);
    }
  }
  return out.toSorted((a, b) => a.start - b.start);
}

/** How far into the fault `ts` is: 0 at its start, 1 at 60% of it and after. */
export function progress(f: Fault, ts: number): number {
  return Math.min(1, Math.max(0, (ts - f.start) / (0.6 * (f.end - f.start))));
}
