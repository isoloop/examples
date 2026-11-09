// Stream names to topic names: `T3.vib` is `plant.t3.vib`, `alarms` is
// `plant.alarms`. No Zod here, so isolates can import it.
import type { Keep } from '../core/retention';
import type { StreamName } from '../core/streams';
import type { MachineId } from '../core/machines';

export const topicName = (s: StreamName): string => `plant.${s.toLowerCase()}`;

/** Every topic of a machine, as a grant pattern. */
export const machineTopics = (m: MachineId): string => `plant.${m.toLowerCase()}.*`;

export function retentionOf(
  k: Keep,
): { kind: 'time'; ms: number } | { kind: 'last-n'; n: number } | { kind: 'compacted' } {
  return k.kind === 'keyed' ? { kind: 'compacted' } : k;
}
