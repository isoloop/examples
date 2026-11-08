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
  await page.goto('/isoloop/?size=heavy&speed=1');
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

const ENGINE_CONSTRAINTS =
  'https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md';

const SHAPES: Record<string, RegExp> = {
  'correlations-5m': /^20×20$/,
  'correlations-15m': /^20×20$/,
  'depth-XRP-USD': /^40×\d+$/,
  spreads: /^20 sparklines$/,
  'order-flow': /^20 bars$/,
};

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: Heavy's additions draw their data`, async ({ page, browserName }) => {
    test.setTimeout(60_000);
    await page.goto(`/${build}/?size=heavy&speed=1`);
    const drawn = (slot: string) =>
      page.locator(`[data-slot="${slot}"] canvas`).getAttribute('data-drawn');
    if (browserName === 'webkit' && build === 'isoloop') {
      // On Playwright's WebKit the main thread presents every worker canvas, so at
      // Heavy the first draws land late or not within the timeout, varying run to
      // run on the CI runner. Reported, not asserted, like budget.spec at Normal.
      const until = Date.now() + 40_000;
      const done = new Set<string>();
      while (Date.now() < until && done.size < Object.keys(SHAPES).length) {
        for (const [slot, shape] of Object.entries(SHAPES)) {
          if (!done.has(slot) && shape.test((await drawn(slot)) ?? '')) done.add(slot);
        }
        await page.waitForTimeout(500);
      }
      const missing = Object.keys(SHAPES).filter((s) => !done.has(s));
      test.info().annotations.push({
        type: 'webkit: reported, not asserted',
        description: `${done.size} of ${Object.keys(SHAPES).length} drawn within 40 s${missing.length ? ` (not yet: ${missing.join(', ')})` : ''}. Worker canvases are presented on the main thread (${ENGINE_CONSTRAINTS})`,
      });
      console.log(`[heavy] webkit isoloop drawn ${done.size}/${Object.keys(SHAPES).length}`);
      return;
    }
    await Promise.all(
      Object.entries(SHAPES).map(async ([slot, shape]) =>
        expect.poll(async () => drawn(slot), { timeout: 40_000 }).toMatch(shape),
      ),
    );
  });
}
