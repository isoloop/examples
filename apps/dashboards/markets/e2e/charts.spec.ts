import { expect, test, type Locator, type Page } from '@playwright/test';

const CHARTS = ['price', 'spread', 'volume'] as const;
const chart = (page: Page, name: string): Locator => page.locator(`[data-slot="${name}"] canvas`);

/** Waits until the element's pixels differ from `before`. */
async function changes(el: Locator, before: Buffer): Promise<void> {
  await expect
    .poll(async () => Buffer.compare(await el.screenshot(), before) !== 0, { timeout: 10_000 })
    .toBe(true);
}

for (const build of ['isoloop', 'native'] as const) {
  test.describe(build, () => {
    test('changing the symbol filter redraws all three charts', async ({ page }) => {
      await page.goto(`/${build}/?size=lite&speed=10`);
      await Promise.all(CHARTS.map((c) => expect(chart(page, c)).toBeVisible()));
      // Let the charts fill, then freeze the picture to compare against.
      await page.waitForTimeout(3_000);
      const before = await Promise.all(CHARTS.map((c) => chart(page, c).screenshot()));
      await page.locator('select[name="symbol"]').selectOption('ETH-USD');
      await Promise.all(
        CHARTS.map((c, i) => changes(chart(page, c), before[i] ?? Buffer.alloc(0))),
      );
    });
  });
}

test('stopping one chart isolate leaves the others drawing', async ({ page }) => {
  await page.goto('/isoloop/?size=lite&speed=10');
  await page.waitForTimeout(2_000);
  await page.evaluate(() => window.kernel.stop('price'));
  await Promise.all(
    ['spread', 'volume'].map(async (c) => {
      const before = await chart(page, c).screenshot();
      await changes(chart(page, c), before);
    }),
  );
});
