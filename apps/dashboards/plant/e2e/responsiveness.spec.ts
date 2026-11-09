import { expect, test, type Page } from '@playwright/test';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn } from './scope';

// M3d task 9: the tape, the echo box and the badge, the metrics panel and
// the category panel, the same on every build; and nothing on the page moves
// while it fills.
const metric = (page: Page, key: string) => page.locator(`[data-metric="${key}"] dd`);

declare global {
  interface Window {
    /** The first machine section's top, each time it changed. */
    sectionTops?: number[];
  }
}

for (const build of inScope(BUILDS)) {
  test(`${build}: the responsiveness strip and the panels show values`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`/${build}/`);
    const badge = page.getByRole('status', { name: 'Main-thread responsiveness' });
    await expect(badge.locator('[data-badge="fps"]')).toHaveText(/^[1-9]\d* fps$/, {
      timeout: 10_000,
    });
    await page.locator('input[name="echo"]').pressSequentially('abc');
    await expect(page.locator('output[name="echoed"]')).toHaveText('abc');
    await expect(badge.locator('[data-badge="input"]')).toHaveText(/^input \d+ ms$/, {
      timeout: 10_000,
    });
    await expect
      .poll(() => page.evaluate(() => window.tape.gaps.length), { timeout: 10_000 })
      .toBeGreaterThan(10);
    const isoloop = build === 'isoloop';
    const soon = { timeout: 10_000 };
    await expect(metric(page, 'fps')).toHaveText(/^[1-9]\d*$/, soon);
    await expect(metric(page, 'long-tasks')).toHaveText(/^\d+$/, soon);
    await expect(metric(page, 'input')).toHaveText(/^\d+ ms$/, soon);
    await expect(metric(page, 'worker-lag')).toHaveText(isoloop ? /^\d+ ms$/ : 'n/a', soon);
    await expect(metric(page, 'bus')).toHaveText(isoloop ? /^\d+ rec\/s$/ : 'n/a', soon);
    // split: 18 workers; native + workers: 9; native: none.
    await expect(metric(page, 'workers')).toHaveText(
      { isoloop: '18', native: '0', 'native-workers': '9' }[build],
      soon,
    );
    await expect(metric(page, 'memory')).toHaveText('unavailable', soon);
    await expect(metric(page, 'first-data')).toHaveText(/^\d+ ms$/, soon);
    await expect(metric(page, 'bundle')).toHaveText(/^\d+ KB$/, soon);
    // Every category's row, with figures.
    await expect
      .poll(() => page.evaluate(() => window.categories().map((r) => r.category)), soon)
      .toEqual(
        expect.arrayContaining([
          'raw · canvas',
          'raw · dom',
          'filtered · dom',
          'aggregated · canvas',
          'aggregated · dom',
          'combined · canvas',
          'combined · dom',
          'engines',
        ]),
      );
  });

  test(`${build}: the machines stay put while the page fills`, async ({ page, browserName }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.addInitScript(() => {
      const tops: number[] = [];
      window.sectionTops = tops;
      const tick = (): void => {
        const s = document.querySelector('section.machine');
        if (s) {
          const top = Math.round(s.getBoundingClientRect().top);
          if (tops.at(-1) !== top) tops.push(top);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(`/${build}/`);
    await expect
      .poll(() => page.evaluate(() => window.categories().length), { timeout: 15_000 })
      .toBeGreaterThan(0);
    await page.waitForTimeout(2_000);
    const tops = await page.evaluate(() => window.sectionTops ?? []);
    expect(tops, `the first machine's top over time: ${tops.join(' → ')}`).toHaveLength(1);
  });
}
