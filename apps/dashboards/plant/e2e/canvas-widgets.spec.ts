import { expect, test, type Page } from '@playwright/test';
import { MACHINES } from '../src/core/machines';
import { faultAt } from '../src/core/sensors/faults';
import { params, scalarsAt } from '../src/core/sensors/signals';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn, FIRST_DATA } from './scope';

// M3d task 4: each machine's canvas widgets draw on every build, and what they
// draw matches the seeded data, so the builds agree with each other.
const drawn = (page: Page, slot: string) => page.locator(`[data-slot="${slot}"] canvas`).first();

/** The canvas's description, inside a surface's shadow root or not. */
async function description(page: Page, slot: string): Promise<string | null> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-slot="${id}"]`);
    const find = (root: ParentNode): Element | null => {
      const c = root.querySelector('canvas[data-drawn]');
      if (c) return c;
      for (const e of root.querySelectorAll('*')) {
        if (e.shadowRoot) {
          const hit = find(e.shadowRoot);
          if (hit) return hit;
        }
      }
      return null;
    };
    return el ? (find(el)?.getAttribute('data-drawn') ?? null) : null;
  }, slot);
}

for (const build of inScope(BUILDS)) {
  test(`${build}: every machine's canvas widgets draw the seeded data`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`/${build}/?rate=2&seed=1`);
    await Promise.all(
      MACHINES.map((m) =>
        expect(drawn(page, `${m}-spectrum`)).toBeVisible({ timeout: FIRST_DATA }),
      ),
    );
    // Each waveform draws at the rate.
    await expect
      .poll(() => Promise.all(MACHINES.map((m) => description(page, `${m}-waveform`))), {
        timeout: 15_000,
      })
      .toEqual(MACHINES.map(() => '2000 samples/s'));
    // Each spectrum's peak is the machine's shaft frequency, unless a fault changes it.
    await expect
      .poll(
        async () =>
          (await Promise.all(MACHINES.map((m) => description(page, `${m}-spectrum`)))).every(
            Boolean,
          ),
        { timeout: 15_000 },
      )
      .toBe(true);
    const now = Date.now();
    const ds = await Promise.all(MACHINES.map((m) => description(page, `${m}-spectrum`)));
    for (const [i, m] of MACHINES.entries()) {
      const d = ds[i];
      if (faultAt(1, m, now) || faultAt(1, m, now - 5_000)) continue;
      const hz = Number(/peak ([\d.]+) Hz/.exec(d ?? '')?.[1]);
      const binHz = 2000 / 1024;
      expect(Math.abs(hz - params(1, m).rpm / 60)).toBeLessThanOrEqual(binHz * 1.01);
    }
    // Each temperature trend's last row is the generator's row at its time.
    await expect.poll(() => description(page, 'T5-temps'), { timeout: 15_000 }).toMatch(/^bearing/);
    const d = (await description(page, 'T5-temps')) ?? '';
    const [, bearing, exhaust, ts] = /bearing ([\d.]+) exhaust ([\d.]+) at (\d+)/.exec(d) ?? [];
    const row = scalarsAt(1, 'T5', Number(ts));
    expect(Number(bearing)).toBeCloseTo(row.bearingTemp, 1);
    expect(Number(exhaust)).toBeCloseTo(row.exhaustTemp, 1);
  });
}
