import { expect, test, type Page } from '@playwright/test';
import { WEBKIT_STOPS, FIRST_DATA } from './scope';

// M3d task 7: the four placements (decision 6), what a block takes down in
// each (decision 9), and the persistent alarms and events (decision 5).
const MACHINE_WIDGETS = [
  'spectrum',
  'waveform',
  'temps',
  'gauges',
  'health',
  'alarms',
  'events',
  'sensors',
];
const T3_WIDGETS = MACHINE_WIDGETS.map((w) => `T3-${w}`);
const T3_DATA = ['feed-T3', 'fft-T3', 'stats-T3', 'health-T3'];

/** What a blocked T3-gauges takes down with it, by placement. */
const BLAST: Record<string, string[]> = {
  split: T3_WIDGETS,
  machine: [...T3_WIDGETS, ...T3_DATA],
  'shared-engines': T3_WIDGETS,
  own: ['T3-gauges'],
};

declare global {
  interface Window {
    /** Isolates that crashed since the test started watching. */
    crashed: string[];
  }
}

const at = (page: Page, slot: string, css: string) => page.locator(`[data-slot="${slot}"] ${css}`);
const ts = async (page: Page, slot: string): Promise<number> =>
  Number(await at(page, slot, '.gauges').getAttribute('data-ts'));

test.beforeEach(({ browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_STOPS);
});

for (const [placement, blast] of Object.entries(BLAST)) {
  test(`${placement}: a blocked widget takes down exactly its pool, which catches up`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`/isoloop/?placement=${placement}`);
    await expect(at(page, 'T3-gauges', '.gauges')).toHaveAttribute('data-ts', /\d/, {
      timeout: 20_000,
    });
    await expect(at(page, 'T4-gauges', '.gauges')).toHaveAttribute('data-ts', /\d/);
    await page.evaluate(() => {
      window.crashed = [];
      window.kernel.on('isolate:crash', (e) => {
        window.crashed.push(e.id);
      });
    });
    await page.locator('[data-slot="T3-gauges"]').hover();
    await at(page, 'T3-gauges', 'button[name="stress-block"]').click();
    // The kernel kills a loop busy for 2 s; the block lasts 3 s.
    await expect
      .poll(() => page.evaluate(() => window.crashed.toSorted()), { timeout: 10_000 })
      .toEqual(blast.toSorted());
    // Another machine kept going all along.
    const t4 = await ts(page, 'T4-gauges');
    await expect.poll(() => ts(page, 'T4-gauges')).toBeGreaterThan(t4);
    // The pool restarts and catches up: the gauges move again, and the trend
    // and the sensor table come back from the retained topics.
    const t3 = await ts(page, 'T3-gauges').catch(() => 0);
    await expect
      .poll(() => ts(page, 'T3-gauges').catch(() => 0), { timeout: 15_000 })
      .toBeGreaterThan(t3);
    await expect(at(page, 'T3-temps', 'canvas')).toHaveAttribute('data-drawn', /^bearing/, {
      timeout: 15_000,
    });
    await expect(at(page, 'T3-sensors', 'tr[data-sensor]')).toHaveCount(6, { timeout: 15_000 });
    const states = await page.evaluate(() =>
      window.kernel
        .isolates()
        .filter((i) => i.state !== 'running')
        .map((i) => i.id),
    );
    expect(states).toEqual([]);
  });
}

test('own: the page warns about the worker count', async ({ page }) => {
  await page.goto('/isoloop/?placement=own');
  await expect(page.locator('[data-notice="own"]')).toContainText('over Isoloop');
  await page.goto('/isoloop/?placement=split');
  await expect(page.locator('[data-notice="own"]')).toHaveCount(0);
});

for (const build of ['native', 'native-workers']) {
  test(`${build}: a blocked widget stalls the whole page`, async ({ page }) => {
    await page.goto(`/${build}/`);
    await expect(at(page, 'T3-gauges', '.gauges')).toHaveAttribute('data-ts', /\d/, {
      timeout: FIRST_DATA,
    });
    await page.locator('[data-slot="T3-gauges"]').hover();
    const t0 = Date.now();
    await at(page, 'T3-gauges', 'button[name="stress-block"]').click();
    // The page answers only once the block ends.
    await page.evaluate(() => 0);
    expect(Date.now() - t0).toBeGreaterThan(2_500);
  });
}

const any = { '~standard': {} };

/** Publishes `n` events from the page's kernel and waits for the bus to acknowledge each. */
async function publishEvents(page: Page, from: number, n: number): Promise<void> {
  await page.evaluate(
    async ({ start, count, schema }) => {
      const batch: Promise<unknown>[] = [];
      for (let i = start; i < start + count; i++) {
        batch.push(
          window.kernel.publish(
            { name: 'plant.events', schema },
            {
              value: {
                id: `test-${i}`,
                machine: 'T1',
                kind: 'start',
                text: `test event ${i}`,
                ts: Date.now(),
              },
            },
          ),
        );
        // oxlint-disable-next-line no-await-in-loop -- in batches, so the bus isn't sent 10,000 at once
        if (batch.length === 500) await Promise.all(batch.splice(0));
      }
      await Promise.all(batch);
    },
    { start: from, count: n, schema: any },
  );
}

/** The ids of the test events in `plant.events`, from the start. */
async function eventIds(page: Page): Promise<string[]> {
  return page.evaluate(
    (schema) =>
      new Promise<string[]>((resolve) => {
        const ids: string[] = [];
        let last = performance.now();
        const off = window.kernel.subscribe(
          { name: 'plant.events', schema },
          (r) => {
            const id: unknown =
              typeof r.value === 'object' && r.value !== null ? Reflect.get(r.value, 'id') : '';
            if (typeof id === 'string' && id.startsWith('test-')) ids.push(id);
            last = performance.now();
          },
          { from: 'earliest' },
        );
        const t = setInterval(() => {
          if (performance.now() - last > 500) {
            clearInterval(t);
            off();
            resolve(ids);
          }
        }, 100);
      }),
    any,
  );
}

test('alarms and events keep every acknowledged record across a reload, up to 10,000', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'OPFS persistence is checked on Chromium');
  test.setTimeout(90_000);
  await page.goto('/isoloop/');
  await expect(page.locator('[data-notice="memory"]')).toHaveCount(0);
  await publishEvents(page, 0, 40);
  await page.reload();
  expect(await eventIds(page)).toEqual(Array.from({ length: 40 }, (_, i) => `test-${i}`));
  // Capped: the oldest go first.
  await publishEvents(page, 40, 10_000);
  await page.reload();
  const ids = await eventIds(page);
  expect(ids.length).toBeLessThanOrEqual(10_000);
  expect(ids.length).toBeGreaterThan(9_900);
  expect(ids.at(-1)).toBe('test-10039');
  expect(ids).not.toContain('test-0');
});

test('a second tab keeps alarms and events in memory, and says so', async ({ page, context }) => {
  await page.goto('/isoloop/');
  await expect(at(page, 'T1-gauges', '.gauges')).toHaveAttribute('data-ts', /\d/, {
    timeout: 20_000,
  });
  const second = await context.newPage();
  await second.goto('/isoloop/');
  await expect(second.locator('[data-notice="memory"]')).toContainText('in memory only', {
    timeout: 20_000,
  });
});
