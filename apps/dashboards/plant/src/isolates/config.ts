// An engine or feed isolate's config, checked: the host passes it at spawn.
import { isMachine, type MachineId } from '../core/machines';

export interface JobConfig {
  machine: MachineId;
  seed: number;
  rateKHz: number;
}

export function jobConfig(c: unknown): JobConfig {
  const get = (k: string): unknown =>
    typeof c === 'object' && c !== null ? Reflect.get(c, k) : undefined;
  const machine = get('machine');
  const seed = get('seed');
  const rateKHz = get('rateKHz');
  if (typeof machine !== 'string' || !isMachine(machine)) throw new Error('no machine in config');
  return {
    machine,
    seed: typeof seed === 'number' ? seed : 1,
    rateKHz: typeof rateKHz === 'number' ? rateKHz : 1,
  };
}
