import { expect, test } from '@playwright/test';
import { records } from './records';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn } from './scope';

// M3d task 3: every build runs the same engines, so each machine's spectrum,
// stats and health and the fleet's figures arrive.
const MACHINES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

for (const build of inScope(BUILDS)) {
  test(`${build}: every engine publishes`, async ({ page, browserName }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`/${build}/`);
    const got = await records(page, build, [
      ...MACHINES.flatMap((m) => [`${m}.spectrum`, `${m}.stats`, `${m}.health`]),
      'fleet',
    ]);
    const spectrum = got['T4.spectrum']?.[0];
    expect(spectrum).toHaveProperty('mags', expect.any(Float32Array));
    expect(got['T8.stats']?.[0]).toHaveProperty('sensors.speed.p95', expect.any(Number));
    expect(got['T1.health']?.[0]).toHaveProperty('score', expect.any(Number));
    const fleet = got['fleet']?.[0];
    expect(fleet).toHaveProperty('machines', expect.any(Array));
    expect(fleet).toHaveProperty('correlation', expect.any(Array));
  });
}
