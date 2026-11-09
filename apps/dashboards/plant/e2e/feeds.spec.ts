import { expect, test, type Page } from '@playwright/test';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn } from './scope';

// M3d task 2: every machine's feed publishes its vibration chunks and slow
// rows, on the bus (Isoloop) or into the page's store (native builds), the
// samples as a Float32Array sized by the rate.
const any = { '~standard': {} };

interface Seen {
  machines: string[];
  float32: boolean;
  samples: number;
  scalars: number;
}

async function watch(page: Page, build: string): Promise<Seen> {
  return page.evaluate(
    async ({ which, schema }) => {
      const machines = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] as const;
      const seen = new Set<string>();
      let float32 = true;
      let samples = 0;
      let scalars = 0;
      const offs: (() => void)[] = [];
      for (const m of machines) {
        const onVib = (r: { value: unknown }): void => {
          const v: unknown =
            typeof r.value === 'object' && r.value !== null ? Reflect.get(r.value, 'values') : null;
          float32 &&= v instanceof Float32Array;
          if (v instanceof Float32Array) samples = v.length;
          seen.add(m);
        };
        const onRow = (): void => {
          scalars++;
        };
        if (which === 'isoloop') {
          const name = `plant.${m.toLowerCase()}`;
          offs.push(window.kernel.subscribe({ name: `${name}.vib`, schema }, onVib));
          offs.push(window.kernel.subscribe({ name: `${name}.scalars`, schema }, onRow));
        } else {
          offs.push(window.store.subscribe(`${m}.vib`, onVib, 'latest'));
          offs.push(window.store.subscribe(`${m}.scalars`, onRow, 'latest'));
        }
      }
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (seen.size === machines.length && scalars >= 16) {
            clearInterval(id);
            resolve();
          }
        }, 50);
      });
      for (const off of offs) off();
      return { machines: [...seen].toSorted(), float32, samples, scalars };
    },
    { which: build, schema: any },
  );
}

for (const build of inScope(BUILDS)) {
  test(`${build}: every machine's feed publishes chunks and rows`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`/${build}/?rate=2`);
    const seen = await watch(page, build);
    expect(seen.machines).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);
    expect(seen.float32).toBe(true);
    expect(seen.samples).toBe(100);
  });
}
