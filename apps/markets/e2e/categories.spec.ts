import { expect, test } from '@playwright/test';

// M3c task 10: time per category, on both builds at Normal.
const CATEGORIES = [
  'raw · canvas',
  'raw · dom',
  'filtered · canvas',
  'filtered · dom',
  'aggregated · canvas',
  'aggregated · dom',
  'combined · canvas',
  'combined · dom',
  'engines',
];

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: every category shows its time at Normal`, async ({ page }) => {
    await page.goto(`/${build}/?size=normal&speed=1`);
    await expect
      .poll(async () => page.evaluate(() => window.categories().map((r) => r.category)), {
        timeout: 15_000,
      })
      .toEqual(CATEGORIES);
    const rows = await page.evaluate(() => window.categories());
    for (const r of rows) {
      expect(r.slots).toBeGreaterThan(0);
      expect(r.workMsPerSec).toBeGreaterThanOrEqual(0);
    }
    // Widgets that render something spend measurable time.
    expect(rows.find((r) => r.category === 'combined · canvas')?.workMsPerSec).toBeGreaterThan(0);
    const apply = rows.map((r) => r.applyMsPerSec);
    if (build === 'native') expect(apply.every((a) => a === null)).toBe(true);
    else expect(apply.every((a) => typeof a === 'number')).toBe(true);
    await expect(
      page.locator('.categories tr[data-category="engines"] td[data-col="work"]'),
    ).toHaveText(/^\d+\.\d$/);
  });
}

test('the About panel shows the core count and the budget note', async ({ page }) => {
  await page.goto('/isoloop/?size=lite&speed=1');
  await page.getByText('About this demo').click();
  await expect(page.locator('[data-about="cores"]')).toHaveText(/reports \d+ logical cores/);
  await expect(page.getByText('within the soft budget of 32 workers')).toBeVisible();
});
