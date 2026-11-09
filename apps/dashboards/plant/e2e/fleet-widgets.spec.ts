import { expect, test, type Page } from '@playwright/test';
import { overheatingNow } from './faults';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn } from './scope';

// M3d task 6: the fleet widgets agree with each other and with the machines
// on every build.
const at = (page: Page, slot: string, css: string) => page.locator(`[data-slot="${slot}"] ${css}`);
const MACHINES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

for (const build of inScope(BUILDS)) {
  test(`${build}: the fleet widgets show every machine`, async ({ page, browserName }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    const { seed, fault } = overheatingNow();
    await page.goto(`/${build}/?seed=${seed}`);
    // Status grid: a tile per machine; the overheating one in alarm.
    await expect(at(page, 'fleet-status', '.tile')).toHaveCount(8, { timeout: 15_000 });
    await expect(
      at(page, 'fleet-status', `.tile[data-machine="${fault.machine}"]`),
    ).toHaveAttribute('data-status', 'alarm', { timeout: 15_000 });
    // Total power is the machines' power; load shares add up to 1.
    await expect(at(page, 'fleet-load', '.load-row')).toHaveCount(8);
    const shares = await at(page, 'fleet-load', '.load-row').evaluateAll((els) =>
      els.reduce((n, el) => n + Number(el.getAttribute('data-share')), 0),
    );
    expect(shares).toBeCloseTo(1, 2);
    // Anomaly ranking sorted; every machine in the bearings table.
    const anomalies = await at(page, 'fleet-anomaly', 'tr').evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-anomaly'))),
    );
    expect(anomalies).toEqual(anomalies.toSorted((a, b) => b - a));
    const bearings = await at(page, 'fleet-bearings', 'tr').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-machine')),
    );
    expect(bearings.toSorted((a, b) => (a ?? '').localeCompare(b ?? ''))).toEqual(MACHINES);
    // Sorted hottest first; the overheating machine's bearing is past its
    // warning limit (another machine's fault can be hotter still).
    const temps = await at(page, 'fleet-bearings', 'tr').evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-temp'))),
    );
    expect(temps).toEqual(temps.toSorted((a, b) => b - a));
    await expect
      .poll(async () =>
        Number(
          await at(page, 'fleet-bearings', `tr[data-machine="${fault.machine}"]`).getAttribute(
            'data-temp',
          ),
        ),
      )
      .toBeGreaterThan(85);
    // The combined alarm feed has the overheating machine's alarm.
    await expect(
      at(page, 'fleet-alarms', `.feed-alarm[data-machine="${fault.machine}"]`).first(),
    ).toBeVisible();
    // The canvases draw.
    await expect(at(page, 'fleet-correlation', 'canvas')).toHaveAttribute('data-drawn', '8×8', {
      timeout: 15_000,
    });
    await expect(at(page, 'fleet-trend', 'canvas')).toHaveAttribute('data-drawn', /\d+ points/);
    await expect(at(page, 'fleet-power', '.big')).toHaveAttribute('data-total', /\d/);
  });
}
