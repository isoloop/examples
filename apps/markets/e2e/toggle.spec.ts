import { expect, test, type Page } from '@playwright/test';

const builds = [
  ['isoloop', 'native'],
  ['native', 'isoloop'],
] as const;

/** The replay position in the URL, in recording ms. */
const at = (page: Page): number => Number(new URL(page.url()).searchParams.get('at'));

for (const [from, to] of builds) {
  test(`${from} → ${to}: the toggle lands on the other build with the same filters and replay position`, async ({
    page,
  }) => {
    await page.goto(`/${from}/?speed=10&seed=3`);
    const filters = page.locator('[data-slot="filters"]');
    await filters.locator('select[name="symbol"]').selectOption('ETH-USD');
    await filters.locator('input[name="exchange-okx"]').click();
    // The URL mirrors the filters as they change. (On Isoloop the clicked
    // checkbox can stay drawn as checked although the filters dropped okx: a
    // render-bridge bug with controlled checkboxes, reported separately; so
    // this checks the published state.)
    const url = (k: string) => () => new URL(page.url()).searchParams.get(k);
    await expect.poll(url('symbol')).toBe('ETH-USD');
    await expect.poll(url('ex')).toBe('coinbase,kraken,bitstamp');
    await page.waitForTimeout(2_000);
    const before = Date.now();
    await page.getByRole('link', { name: `Switch to ${to}` }).click();
    await page.waitForURL(`**/${to}/**`);
    // About 2 s at 10×, plus boot: 20 s of recording or more, and no more than it could be.
    const loaded = (Date.now() - before) * 10;
    expect(at(page)).toBeGreaterThanOrEqual(18_000);
    expect(at(page)).toBeLessThan(40_000 + loaded);
    const there = page.locator('[data-slot="filters"]');
    await expect(there.locator('select[name="symbol"]')).toHaveValue('ETH-USD');
    await expect(there.locator('input[name="exchange-okx"]')).not.toBeChecked();
    await expect(there.locator('input[name="exchange-kraken"]')).toBeChecked();
    // The pipeline runs on: ETH-USD trades from the exchanges still selected.
    const rows = page.locator('[data-slot="trades"] .trade');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    await expect(rows.first()).not.toContainText('okx');
  });
}
