import { expect, test } from '@playwright/test';
import { WEBKIT_STOPS } from './scope';

// Engine constraint 2, as the plant dashboard meets it: on Playwright's
// WebKit, the Isoloop page's eight waveforms, scrolling every frame in their
// workers, take its main thread. Expected to fail there; if WebKit stops
// presenting worker canvases on the main thread, this starts passing and the
// skips in the other specs can go.
test('isoloop: the main thread keeps running frames with every widget drawing', async ({
  page,
  browserName,
}) => {
  test.fail(browserName === 'webkit', WEBKIT_STOPS);
  test.setTimeout(30_000);
  await page.goto('/isoloop/');
  await page.waitForTimeout(3_000);
  const frames = await Promise.race([
    page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const t0 = performance.now();
          let n = 0;
          const step = (): void => {
            n++;
            if (performance.now() - t0 < 2_000) requestAnimationFrame(step);
            else resolve(n);
          };
          requestAnimationFrame(step);
        }),
    ),
    new Promise<number>((resolve) => {
      setTimeout(() => {
        resolve(0);
      }, 10_000);
    }),
  ]);
  expect(frames).toBeGreaterThan(30);
});
