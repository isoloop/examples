import { describe, expect, it } from 'vitest';
import { MACHINES } from '../core/machines';
import { FLEET_WIDGETS, MACHINE_WIDGETS } from '../widgets/catalog';
import type { JobKind } from './headless';
import { poolOf, whereOf, workersOf, type Item } from './placement';

const JOBS = ['feed', 'fft', 'stats', 'health'] as const satisfies JobKind[];
const ITEMS: Item[] = [];
for (const machine of MACHINES) {
  for (let i = 0; i < MACHINE_WIDGETS.length; i++) ITEMS.push({ kind: 'widget', machine });
  for (const kind of JOBS) ITEMS.push({ kind, machine });
}
for (let i = 0; i < FLEET_WIDGETS.length; i++) ITEMS.push({ kind: 'widget' });
ITEMS.push({ kind: 'fleet' });

describe('placements', () => {
  it('has 72 widgets and 33 headless isolates to place', () => {
    expect(ITEMS.filter((i) => i.kind === 'widget')).toHaveLength(72);
    expect(ITEMS.filter((i) => i.kind !== 'widget')).toHaveLength(33);
  });

  it('runs about 18 workers in split, 10 in machine, 12 in shared-engines, 105 in own', () => {
    expect(workersOf('split', ITEMS)).toBe(18);
    expect(workersOf('machine', ITEMS)).toBe(10);
    expect(workersOf('shared-engines', ITEMS)).toBe(12);
    expect(workersOf('own', ITEMS)).toBe(105);
  });

  it("runs 10 workers in matched (native + workers' 9 plus one for the widgets) and 1 in one", () => {
    expect(workersOf('matched', ITEMS)).toBe(10);
    expect(workersOf('one', ITEMS)).toBe(1);
    expect(poolOf('matched', { kind: 'widget', machine: 'T3' })).toBe('widgets');
    expect(poolOf('matched', { kind: 'widget' })).toBe('widgets');
    expect(poolOf('matched', { kind: 'fft', machine: 'T3' })).toBe('data-T3');
    expect(poolOf('matched', { kind: 'fleet' })).toBeUndefined();
    for (const i of ITEMS) expect(poolOf('one', i)).toBe('all');
  });

  it("puts a machine's widgets and data apart in split, together in machine", () => {
    expect(poolOf('split', { kind: 'widget', machine: 'T3' })).toBe('widgets-T3');
    expect(poolOf('split', { kind: 'fft', machine: 'T3' })).toBe('data-T3');
    expect(poolOf('machine', { kind: 'widget', machine: 'T3' })).toBe('machine-T3');
    expect(poolOf('machine', { kind: 'feed', machine: 'T3' })).toBe('machine-T3');
    expect(poolOf('shared-engines', { kind: 'health', machine: 'T3' })).toBe('engines');
    expect(poolOf('shared-engines', { kind: 'feed', machine: 'T3' })).toBe('feeds');
    expect(poolOf('split', { kind: 'widget' })).toBe('fleet');
    expect(poolOf('split', { kind: 'fleet' })).toBeUndefined();
  });

  it('labels headers as the plan does', () => {
    expect(whereOf('widgets-T3', 1)).toBe('pool T3');
    expect(whereOf('machine-T3', 1)).toBe('pool T3');
    expect(whereOf('fleet', 1)).toBe('pool fleet');
    expect(whereOf(undefined, 41)).toBe('worker 41');
    expect(whereOf('widgets', 1)).toBe('pool widgets');
    expect(whereOf('all', 1)).toBe('pool all');
  });
});
