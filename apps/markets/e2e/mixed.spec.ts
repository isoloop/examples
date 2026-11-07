import { expect, test, type Locator, type Page } from '@playwright/test';

// `/mixed` (M3b task 16b): the filters and the alerts panel run on Preact,
// built apart and loaded by URL; the charts and the table on React. One
// framework per isolate, so a crash on one side leaves the other working.
const slot = (page: Page, name: string): Locator => page.locator(`[data-slot="${name}"]`);

async function draws(page: Page, name: string): Promise<void> {
  const canvas = slot(page, name).locator('canvas');
  const before = await canvas.screenshot();
  await expect
    .poll(async () => Buffer.compare(await canvas.screenshot(), before) !== 0, { timeout: 10_000 })
    .toBe(true);
}

/**
 * The filters still answer: picking a symbol reaches the URL (filters.v1).
 * After a crash the host restarts the isolate with a backoff (ADR 0001), so
 * the pick is retried until the restarted filters publish it.
 */
async function filtersWork(page: Page, symbol: string): Promise<void> {
  const url = (): string | null => new URL(page.url()).searchParams.get('symbol');
  await expect(async () => {
    await slot(page, 'filters').locator('select[name="symbol"]').selectOption(symbol, {
      timeout: 1_000,
    });
    await expect.poll(url, { timeout: 1_000 }).toBe(symbol);
  }).toPass({ timeout: 15_000 });
}

test('the Preact isolates come from their own build', async ({ page }) => {
  const loaded: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/mixed/preact/')) loaded.push(new URL(r.url()).pathname);
  });
  await page.goto('/mixed/?speed=10');
  await filtersWork(page, 'ETH-USD');
  await expect(slot(page, 'alerts-panel').getByRole('button', { name: 'Add rule' })).toBeVisible();
  expect(loaded.some((p) => p.endsWith('/filters.js'))).toBe(true);
  expect(loaded.some((p) => p.endsWith('/alerts-panel.js'))).toBe(true);
});

test('a crashed Preact widget leaves the React ones drawing', async ({ page }) => {
  await page.goto('/mixed/?speed=10');
  await draws(page, 'price');
  await slot(page, 'filters').locator('button[name="stress-crash"]').click();
  await Promise.all([draws(page, 'price'), draws(page, 'spread')]);
  // The host restarts it, on Preact again.
  await filtersWork(page, 'SOL-USD');
});

test('a crashed React widget leaves the Preact ones working', async ({ page }) => {
  await page.goto('/mixed/?speed=10');
  await draws(page, 'price');
  await slot(page, 'price').locator('button[name="stress-crash"]').click();
  await filtersWork(page, 'ETH-USD');
  await draws(page, 'spread');
});
