import { expect, test, type Page } from '@playwright/test';
import { WEBKIT_STOPS, FIRST_DATA } from './scope';

// M3d task 7: the placements (decision 6, plus matched and one), what a block takes down in
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

/**
 * What a blocked T3-gauges takes down with it, by placement: a list of
 * isolates, or `pool`, every member of T3-gauges' pool (in `matched` all 72
 * widgets, in `one` every isolate on the page).
 */
const BLAST: Record<string, string[] | 'pool'> = {
  split: T3_WIDGETS,
  machine: [...T3_WIDGETS, ...T3_DATA],
  'shared-engines': T3_WIDGETS,
  own: ['T3-gauges'],
  matched: 'pool',
  one: 'pool',
};
/** Placements where T4's gauges share the blocked pool, so they stall too. */
const T4_SHARES = new Set(['matched', 'one']);

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
    const expected =
      blast === 'pool'
        ? await page.evaluate(() => {
            const pool = window.kernel.isolates().find((i) => i.id === 'T3-gauges')?.pool;
            return window.kernel
              .isolates()
              .filter((i) => i.pool !== undefined && i.pool === pool)
              .map((i) => i.id);
          })
        : blast;
    if (blast === 'pool') expect(expected.length).toBeGreaterThanOrEqual(72);
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
      .toEqual(expected.toSorted());
    // Another machine kept going all along, unless its widgets share the pool.
    if (!T4_SHARES.has(placement)) {
      const t4 = await ts(page, 'T4-gauges');
      await expect.poll(() => ts(page, 'T4-gauges')).toBeGreaterThan(t4);
    }
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

/** The temperature trend's held rows and the time of its first one. */
const trend = async (page: Page): Promise<{ rows: number; from: number }> => {
  const d =
    (await at(page, 'T3-temps', 'canvas')
      .getAttribute('data-drawn')
      .catch(() => null)) ?? '';
  const [, rows, from] = /rows (\d+) from (\d+)/.exec(d) ?? [];
  return { rows: Number(rows ?? 0), from: Number(from ?? 0) };
};
/** The sensor table's 60 s minimum of the bearing temperature, as shown. */
const bearingMin = async (page: Page): Promise<number> => {
  const cells = await at(page, 'T3-sensors', 'tr[data-sensor="bearingTemp"] td')
    .allInnerTexts()
    .catch(() => []);
  // Columns: last, min, p50, p95, p99, max.
  return Number.parseFloat(cells[1] ?? 'NaN');
};

test('one: a restarted pool reads its trend and its stats back from the retained topics', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/isoloop/?placement=one');
  // Let some history build up first: the trend holds a row every 200 ms.
  await expect.poll(async () => (await trend(page)).rows, { timeout: 30_000 }).toBeGreaterThan(75);
  const before = await trend(page);
  const min = await bearingMin(page);
  expect(min).not.toBeNaN();
  await page.evaluate(() => {
    window.crashed = [];
    window.kernel.on('isolate:crash', (e) => {
      window.crashed.push(e.id);
    });
  });
  await page.locator('[data-slot="T3-gauges"]').hover();
  await at(page, 'T3-gauges', 'button[name="stress-block"]').click();
  // In `one` the whole pool restarts: the trend and the stats engine with it.
  await expect
    .poll(() => page.evaluate(() => window.crashed), { timeout: 10_000 })
    .toEqual(expect.arrayContaining(['T3-temps', 'stats-T3']));
  // The restarted trend starts from the same first row: every row since the
  // page opened is still retained, and it reads them all back.
  await expect.poll(async () => (await trend(page)).from, { timeout: 20_000 }).toBe(before.from);
  expect((await trend(page)).rows).toBeGreaterThanOrEqual(before.rows);
  // The restarted stats engine reads the minute back too, so its minimum
  // covers the rows from before the block: no higher than before.
  await expect.poll(() => bearingMin(page), { timeout: 20_000 }).toBeLessThanOrEqual(min);
});

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
