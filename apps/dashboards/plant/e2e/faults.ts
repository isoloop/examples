import { MACHINES, type MachineId } from '../src/core/machines';
import { cycleOf, faultInCycle, type Fault } from '../src/core/sensors/faults';

/**
 * A seed under which some machine is overheating now, `inMs` into the fault
 * and with at least `leftMs` of it to go: tests that need alarms pick it,
 * since the schedule is a pure function of the seed and the time.
 */
export function overheatingNow(inMs = 12_000, leftMs = 18_000): { seed: number; fault: Fault } {
  const now = Date.now();
  for (let seed = 1; seed < 20_000; seed++) {
    for (const m of MACHINES) {
      const f = faultInCycle(seed, m, cycleOf(seed, now));
      if (f?.kind === 'overheat' && now - f.start >= inMs && f.end - now >= leftMs) {
        return { seed, fault: f };
      }
    }
  }
  throw new Error('no seed overheats now');
}

export type { MachineId };
