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
    const started = Date.now();
    await page.goto(`/${from}/?size=lite&speed=10&seed=3`);
    const filters = page.locator('[data-slot="filters"]');
    await filters.locator('select[name="symbol"]').selectOption('ETH-USD');
    await filters.locator('input[name="exchange-okx"]').click();
    // Drawn as the filters say, in both builds: a controlled checkbox whose
    // state comes back from a topic (isoloop/isoloop#127).
    await expect(filters.locator('input[name="exchange-okx"]')).not.toBeChecked();
    // The URL mirrors the filters as they change.
    const url = (k: string) => () => new URL(page.url()).searchParams.get(k);
    await expect.poll(url('symbol')).toBe('ETH-USD');
    await expect.poll(url('ex')).toBe('coinbase,kraken,bitstamp');
    await page.waitForTimeout(2_000);
    await page.getByRole('link', { name: `Switch to ${to}` }).click();
    await page.waitForURL(`**/${to}/**`);
    // At least the 2 s wait at 10× (20 s of recording), and no more than the
    // whole test so far at 10×: a slow runner takes longer to get here, and the
    // replay plays on meanwhile.
    expect(at(page)).toBeGreaterThanOrEqual(18_000);
    expect(at(page)).toBeLessThan((Date.now() - started) * 10 + 5_000);
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
