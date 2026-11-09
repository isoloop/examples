import { expect, test, type Page } from '@playwright/test';
import { MACHINES } from '../src/core/machines';
import { scalarsAt } from '../src/core/sensors/signals';
import { overheatingNow } from './faults';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn, FIRST_DATA } from './scope';

// M3d task 5: each machine's DOM widgets show the seeded data on every build,
// and the event log's filter works on every build.
const at = (page: Page, slot: string, css: string) => page.locator(`[data-slot="${slot}"] ${css}`);

for (const build of inScope(BUILDS)) {
  test(`${build}: gauges, health and sensor tables show the seeded data`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`/${build}/?seed=3`);
    await Promise.all(
      MACHINES.map((m) =>
        expect(at(page, `${m}-gauges`, '.gauges')).toHaveAttribute('data-ts', /\d/, {
          timeout: FIRST_DATA,
        }),
      ),
    );
    // Each gauge shows the generator's value at its row's time.
    const gauges = await Promise.all(
      MACHINES.map(async (m) => {
        const g = at(page, `${m}-gauges`, '.gauges');
        // Read the time and the values in one go: the widget updates 5 times a second.
        return g.evaluate((el) => {
          const values: Record<string, number> = {};
          for (const x of el.querySelectorAll('[data-gauge]')) {
            values[x.getAttribute('data-gauge') ?? ''] = Number(x.getAttribute('data-value'));
          }
          return { ts: Number(el.getAttribute('data-ts')), values };
        });
      }),
    );
    for (const [i, m] of MACHINES.entries()) {
      const { ts, values } = gauges[i] ?? { ts: 0, values: {} };
      const row = scalarsAt(3, m, ts);
      expect(values['speed']).toBeCloseTo(row.speed, 1);
      expect(values['power']).toBeCloseTo(row.power, 1);
      expect(values['pressure']).toBeCloseTo(row.pressure, 1);
    }
    // Health: a score from 0 to 100 and a status.
    await Promise.all(
      MACHINES.map((m) =>
        expect(at(page, `${m}-health`, '.health')).toHaveAttribute(
          'data-status',
          /^(ok|warn|alarm|stopped)$/,
        ),
      ),
    );
    const score = Number(await at(page, 'T2-health', '.score').innerText());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    // Sensor table: a row per sensor, its percentiles in order.
    await expect(at(page, 'T6-sensors', 'tr[data-sensor]')).toHaveCount(6, { timeout: 15_000 });
    const cells = await at(page, 'T6-sensors', 'tr[data-sensor="exhaustTemp"] td').allInnerTexts();
    const [, min, p50, p95, , max] = cells.map(Number);
    expect(min).toBeLessThanOrEqual(p50 ?? NaN);
    expect(p50).toBeLessThanOrEqual(p95 ?? NaN);
    expect(p95).toBeLessThanOrEqual(max ?? NaN);
  });

  test(`${build}: an overheating machine's alarms, its event log and the filter`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    const { seed, fault } = overheatingNow();
    const m = fault.machine;
    await page.goto(`/${build}/?seed=${seed}`);
    // The engine raises the exhaust alarm within a few seconds of starting.
    await expect(at(page, `${m}-alarms`, '.alarm[data-sensor="exhaustTemp"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(at(page, `${m}-health`, '.health')).toHaveAttribute('data-status', 'alarm');
    const log = (css: string) => at(page, `${m}-events`, css);
    await expect(log('tr.event.alarm').first()).toContainText('exhaust temp');
    // The filter, by text and by kind.
    await log('input[name="event-text"]').fill('exhaust');
    await expect(log('tr.event').first()).toContainText('exhaust');
    await log('input[name="event-text"]').fill('no such event');
    await expect(log('tr.event')).toHaveCount(0);
    await expect(log('.none')).toHaveText('No events');
    await log('input[name="event-text"]').fill('');
    await log('select[name="event-kind"]').selectOption('start');
    await expect(log('tr.event')).toHaveCount(0);
    await log('select[name="event-kind"]').selectOption('alarm');
    await expect(log('tr.event').first()).toBeVisible();
    // Clear history hides what came before.
    await page.locator('button[name="clear-history"]').click();
    await expect(log('tr.event')).toHaveCount(0);
  });
}
