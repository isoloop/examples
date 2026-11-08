import { expect, test, type Page } from '@playwright/test';
import { inScope } from './scope';

// M3c task 7: the DOM widgets at Normal. `data-rows` is how many rows or tiles each shows.
const rows = async (page: Page, slot: string): Promise<number> =>
  Number(await page.locator(`[data-slot="${slot}"] [data-rows]`).getAttribute('data-rows'));

/** Settled row counts: top movers and gaps list 10, the summary one tile per symbol. */
const EXPECTED = { 'top-movers': 10, arbitrage: 10, summary: 20 } as const;

for (const build of inScope([
  'isoloop',
  'native',
  'isoloop-preact',
  'native-preact',
  'mixed',
] as const)) {
  test(`${build}: the DOM widgets fill at Normal`, async ({ page }) => {
    await page.goto(`/${build}/?size=normal&speed=1`);
    await Promise.all([
      ...Object.entries(EXPECTED).map(async ([slot, n]) =>
        expect.poll(async () => rows(page, slot), { timeout: 15_000 }).toBe(n),
      ),
      expect.poll(async () => rows(page, 'tape'), { timeout: 15_000 }).toBeGreaterThanOrEqual(12),
    ]);
  });
}

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: the tape follows the symbol filter`, async ({ page }) => {
    await page.goto(`/${build}/?size=normal&speed=1`);
    await page.locator('select[name="symbol"]').selectOption('XRP-USD');
    // The filter goes through the bus to the tape's isolate; on WebKit at Normal that can take longer than 5 s.
    await expect(page.locator('[data-slot="tape"] h3')).toHaveText('XRP-USD tape by exchange', {
      timeout: 15_000,
    });
  });
}
