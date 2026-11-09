import { isMachine, type MachineId } from '../core/machines';

/** What every widget gets: its slot id, and its machine for a machine widget. */
export interface WidgetConfig {
  slot: string;
  machine?: MachineId;
}

/** The machine a machine widget shows (from its config: native props or the isolate's config). */
export function machineOf(config: unknown): MachineId {
  const m: unknown =
    typeof config === 'object' && config !== null ? Reflect.get(config, 'machine') : undefined;
  if (typeof m !== 'string' || !isMachine(m)) throw new Error('widget: no machine in config');
  return m;
}
