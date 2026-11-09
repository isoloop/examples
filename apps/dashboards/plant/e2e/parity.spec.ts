import { expect, test, type Browser } from '@playwright/test';
import { records } from './records';
import { BUILDS, WEBKIT_STOPS } from './scope';

// M3d task 8: the native + workers build computes what the native build
// does, and so does Isoloop: the same seed gives the same spectra (bit for
// bit, the FFT's hops count samples since the epoch) and the same stats
// inputs in every build.
type Spectra = Record<string, number[]>;

async function spectra(browser: Browser, build: string): Promise<Spectra> {
  const page = await browser.newPage();
  await page.goto(`/${build}/?seed=4&rate=2`);
  const got = await records(page, build, ['T6.spectrum'], 12);
  await page.close();
  const out: Spectra = {};
  for (const v of got['T6.spectrum'] ?? []) {
    const ts: unknown = typeof v === 'object' && v !== null ? Reflect.get(v, 'ts') : null;
    const mags: unknown = typeof v === 'object' && v !== null ? Reflect.get(v, 'mags') : null;
    if (typeof ts === 'number' && mags instanceof Float32Array) out[String(ts)] = [...mags];
  }
  return out;
}

test('every build computes the same spectra from the same seed', async ({
  browser,
  browserName,
}) => {
  test.skip(browserName === 'webkit', WEBKIT_STOPS);
  test.setTimeout(60_000);
  // At the same time, so their windows overlap.
  const [a, b, c] = await Promise.all(BUILDS.map((build) => spectra(browser, build)));
  const common = Object.keys(a ?? {}).filter((ts) => b?.[ts] && c?.[ts]);
  expect(common.length).toBeGreaterThan(3);
  for (const ts of common) {
    expect(b?.[ts]).toEqual(a?.[ts]);
    expect(c?.[ts]).toEqual(a?.[ts]);
  }
});
