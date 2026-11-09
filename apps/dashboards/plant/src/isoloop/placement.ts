// Where the Isoloop build runs each isolate (M3d decision 6): the same code and
// data in every placement; only the host's manifests change.
//
// | placement        | a machine's widgets | its feed and engines  | fleet widgets | fleet engine |
// | ---------------- | ------------------- | --------------------- | ------------- | ------------ |
// | `split`          | pool `widgets-T3`   | pool `data-T3`        | pool `fleet`  | own worker   |
// | `machine`        | pool `machine-T3`   | pool `machine-T3`     | pool `fleet`  | own worker   |
// | `shared-engines` | pool `widgets-T3`   | feeds in pool `feeds`, every engine in pool `engines` | pool `fleet` | own worker |
// | `own`            | own workers         | own workers           | own workers   | own worker   |
import type { MachineId } from '../core/machines';
import type { PlacementName } from '../url';
import type { JobKind } from './headless';

/** What is being placed: a widget (of a machine or the fleet) or a headless job. */
export type Item = { kind: 'widget'; machine?: MachineId } | { kind: JobKind; machine?: MachineId };

export function poolOf(p: PlacementName, item: Item): string | undefined {
  if (p === 'own' || item.kind === 'fleet') return undefined;
  const m = item.machine;
  if (item.kind === 'widget') {
    if (!m) return 'fleet';
    return p === 'machine' ? `machine-${m}` : `widgets-${m}`;
  }
  if (!m) return undefined;
  if (p === 'machine') return `machine-${m}`;
  if (p === 'shared-engines') return item.kind === 'feed' ? 'feeds' : 'engines';
  return `data-${m}`;
}

/** A widget header's "where" (M3d decision 8): `pool T3`, `pool fleet`, `pool engines` or `worker 41`. */
export function whereOf(pool: string | undefined, worker: number): string {
  if (pool === undefined) return `worker ${worker}`;
  return `pool ${pool.replace(/^(widgets|machine|data)-/, '')}`;
}

/** Workers a placement runs, for the page's warning and the comparison. */
export function workersOf(p: PlacementName, items: readonly Item[]): number {
  const pools = new Set<string>();
  let own = 0;
  for (const i of items) {
    const pool = poolOf(p, i);
    if (pool === undefined) own++;
    else pools.add(pool);
  }
  return own + pools.size;
}
