// The architecture diagrams (architecture/*.json, rendered with Archify) show
// how many threads and isolates each build runs. This checks those figures
// against the code, so a placement change that isn't redrawn fails here.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MACHINES } from '../core/machines';
import { FLEET_WIDGETS, MACHINE_WIDGETS } from '../widgets/catalog';
import type { PlacementName } from '../url';
import type { JobKind } from './headless';
import { workersOf, type Item } from './placement';

interface Diagram {
  meta: { subtitle: string };
  components: { id: string; sublabel?: string }[];
  boundaries: { label: string }[];
}

const read = (name: string): Diagram =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the diagram's JSON, checked below
  JSON.parse(
    readFileSync(new URL(`../../architecture/${name}.json`, import.meta.url), 'utf8'),
  ) as Diagram;

const JOBS = ['feed', 'fft', 'stats', 'health'] as const satisfies JobKind[];
const ITEMS: Item[] = [];
for (const machine of MACHINES) {
  for (let i = 0; i < MACHINE_WIDGETS.length; i++) ITEMS.push({ kind: 'widget', machine });
  for (const kind of JOBS) ITEMS.push({ kind, machine });
}
for (let i = 0; i < FLEET_WIDGETS.length; i++) ITEMS.push({ kind: 'widget' });
ITEMS.push({ kind: 'fleet' });

/** Threads the diagram's boxes add up to, leaving out the main thread and the bus worker. */
function boxThreads(d: Diagram): number {
  let n = 0;
  for (const b of d.boundaries) {
    if (/^(Main thread|Bus worker)/.test(b.label)) continue;
    const m = /(\d+) threads?/.exec(b.label);
    if (m) n += Number(m[1]);
  }
  return n;
}

/** Isolates (or, in the native builds, components and jobs) the cards add up to. */
function cardCount(d: Diagram, unit: RegExp): number {
  let n = 0;
  for (const c of d.components) {
    const s = c.sublabel ?? '';
    const times = /^(\d+) × (\d+) /.exec(s);
    if (times && unit.test(s)) n += Number(times[1]) * Number(times[2]);
    else {
      const m = /^(\d+) /.exec(s);
      if (m && unit.test(s)) n += Number(m[1]);
    }
  }
  return n;
}

const ISOLOOP: PlacementName[] = ['one', 'matched', 'split', 'own'];

describe('architecture diagrams', () => {
  for (const p of ISOLOOP) {
    it(`${p}: the threads and isolates drawn are the ones placement.ts runs`, () => {
      const d = read(p);
      const threads = workersOf(p, ITEMS);
      expect(d.meta.subtitle).toBe(
        `${ITEMS.length} isolates on ${threads} thread${threads === 1 ? '' : 's'} + bus`,
      );
      expect(boxThreads(d)).toBe(threads);
      expect(cardCount(d, /isolates?$/)).toBe(ITEMS.length);
    });
  }

  it('native: no workers; 72 widgets and 33 jobs on the main thread', () => {
    const d = read('native');
    expect(boxThreads(d)).toBe(0);
    expect(cardCount(d, /components?$/)).toBe(72);
    expect(cardCount(d, /jobs?$/)).toBe(33);
  });

  it('native + workers: a data worker per machine and a fleet worker', () => {
    const d = read('native-workers');
    // native/workers.ts starts `data-<machine>` for each machine, then `fleet`.
    expect(boxThreads(d)).toBe(MACHINES.length + 1);
    expect(cardCount(d, /components?$/)).toBe(72);
    expect(cardCount(d, /jobs?$/)).toBe(33);
  });
});
