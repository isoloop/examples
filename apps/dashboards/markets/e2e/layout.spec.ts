import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    /** The filters bar's top, each time it changed. */
    filtersTops?: number[];
  }
}

// The filters bar doesn't move while the page fills. The panels above it used
// to grow when their first figures arrived, so a click that started on a
// checkbox could end on the table that slid under the pointer, and no click
// fired (the okx checkbox in toggle.spec stayed checked on slow runners).
for (const build of ['isoloop', 'native'] as const) {
  for (const size of ['lite', 'normal'] as const) {
    test(`${build} at ${size}: the filters bar stays put while the page fills`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const tops: number[] = [];
        window.filtersTops = tops;
        const tick = (): void => {
          const f = document.querySelector('[data-slot="filters"]');
          if (f) {
            const top = Math.round(f.getBoundingClientRect().top);
            if (tops.at(-1) !== top) tops.push(top);
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.goto(`/${build}/?size=${size}&speed=1`);
      // Until the first figures arrive, then 2 s more, while the rest fill in.
      await expect
        .poll(async () => page.evaluate(() => window.categories().length), { timeout: 15_000 })
        .toBeGreaterThan(0);
      await page.waitForTimeout(2_000);
      const tops = await page.evaluate(() => window.filtersTops ?? []);
      expect(tops, `the filters bar's top over time: ${tops.join(' → ')}`).toHaveLength(1);
    });
  }
}
