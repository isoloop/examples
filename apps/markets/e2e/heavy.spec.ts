import { expect, test } from '@playwright/test';

// M3c task 8: Heavy runs 24 widgets and 3 engines within ADR 0001's soft
// budget of 32 workers. Heavy runs on tags, weekly and in the comparison;
// on pull requests it's skipped (M3c decision 11).
const HEAVY = process.env['E2E_HEAVY'] === '1' || !process.env['CI'];

test.skip(!HEAVY, 'Heavy runs on markets-v* tags, weekly and in the comparison');

test('isoloop: Heavy starts its isolates with no budget warning', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'warning' && /budget/i.test(m.text())) warnings.push(m.text());
  });
  await page.goto('/isoloop/?size=heavy&speed=10');
  await expect
    .poll(async () => page.evaluate(() => window.kernel.isolates().length), { timeout: 15_000 })
    .toBe(30);
  const ids = await page.evaluate(() => window.kernel.isolates().map((i) => i.id));
  expect(ids).toEqual(
    expect.arrayContaining([
      'correlations-5m',
      'correlations-15m',
      'depth-DOGE-USD',
      'spreads',
      'order-flow',
    ]),
  );
  expect(ids.length).toBeLessThanOrEqual(32);
  expect(warnings).toEqual([]);
});

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: Heavy's additions draw their data`, async ({ page }) => {
    await page.goto(`/${build}/?size=heavy&speed=10`);
    const shapes = {
      'correlations-5m': /^20×20$/,
      'correlations-15m': /^20×20$/,
      'depth-XRP-USD': /^40×\d+$/,
      spreads: /^20 sparklines$/,
      'order-flow': /^20 bars$/,
    };
    await Promise.all(
      Object.entries(shapes).map(async ([slot, shape]) =>
        expect
          .poll(
            async () => page.locator(`[data-slot="${slot}"] canvas`).getAttribute('data-drawn'),
            {
              timeout: 20_000,
            },
          )
          .toMatch(shape),
      ),
    );
  });
}
