import { expect, test } from '@playwright/test';
import { WEBKIT_STOPS } from './scope';

// Engine constraint 2, as the plant dashboard meets it: on Playwright's
// WebKit, the Isoloop page's eight waveforms, scrolling every frame in their
// workers, take its main thread in `split`, where the canvases are spread
// over nine visual pools. Expected to fail there; if WebKit stops presenting
// worker canvases on the main thread, it starts passing and the skips in the
// other specs can go. In `matched`, the default, all 24 canvases are in one
// visual pool: WebKit kept running frames on the CI runner and stopped on a
// 32-core local machine (2026-11-13), so there it is reported, not asserted.
for (const placement of ['split', 'matched'] as const) {
  test(`isoloop ${placement}: the main thread keeps running frames with every widget drawing`, async ({
    page,
    browserName,
  }) => {
    test.fail(placement === 'split' && browserName === 'webkit', WEBKIT_STOPS);
    test.setTimeout(30_000);
    await page.goto(`/isoloop/?placement=${placement}`);
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
    if (placement === 'matched' && browserName === 'webkit') {
      test.info().annotations.push({ type: 'frames in 2 s', description: String(frames) });
      return;
    }
    expect(frames).toBeGreaterThan(30);
  });
}
