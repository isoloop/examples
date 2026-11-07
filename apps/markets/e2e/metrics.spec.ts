import { expect, test, type Page } from '@playwright/test';

// The metrics panel (M3b task 17): every figure shows a value within 2 s of
// start, Isoloop-only ones say "n/a" on native, and memory says "unavailable"
// without cross-origin isolation (vite preview sets no COOP/COEP).
const metric = (page: Page, key: string) => page.locator(`[data-metric="${key}"] dd`);

const ISOLOOP = ['isoloop', 'isoloop-preact', 'mixed'] as const;
const NATIVE = ['native', 'native-preact'] as const;

for (const build of [...ISOLOOP, ...NATIVE]) {
  test(`${build}: every metric shows a value within 2 s of start`, async ({ page }) => {
    await page.goto(`/${build}/?speed=10`);
    // An input, so input latency has something to measure.
    await page.locator('[data-slot="filters"] select[name="symbol"]').selectOption('ETH-USD');
    const native = (NATIVE as readonly string[]).includes(build);
    const within = { timeout: 2_000 };
    await expect(metric(page, 'fps')).toHaveText(/^[1-9]\d*$/, within);
    await expect(metric(page, 'long-tasks')).toHaveText(/^\d+$/, within);
    await expect(metric(page, 'input')).toHaveText(/^\d+ ms$/, within);
    await expect(metric(page, 'worker-lag')).toHaveText(native ? 'n/a' : /^\d+ ms$/, within);
    await expect(metric(page, 'bus')).toHaveText(native ? 'n/a' : /^\d+ rec\/s$/, within);
    await expect(metric(page, 'memory')).toHaveText('unavailable', within);
    await expect(metric(page, 'first-data')).toHaveText(/^\d+ ms$/, within);
    await expect(metric(page, 'bundle')).toHaveText(/^\d+ KB$/, within);
  });
}
