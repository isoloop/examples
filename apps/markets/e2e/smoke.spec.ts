import { expect, test } from '@playwright/test';

// Installed from npm and built with @isoloop/vite: the pipeline runs (M3b
// tasks 1, 7, 10). The bus is only in the Isoloop build; the native build's
// store answers the same questions.
const any = { '~standard': {} };

test('the root sends visitors to the Isoloop build', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/isoloop\/$/);
  await expect(page.locator('.build')).toHaveAttribute('data-build', 'isoloop');
});

test('the replay source publishes trades to the bus', async ({ page }) => {
  await page.goto('./isoloop/?speed=10');
  const n = await page.evaluate(
    (schema) =>
      new Promise<number>((resolve) => {
        let seen = 0;
        window.kernel.subscribe({ name: 'trades.v1', schema }, () => {
          if (++seen === 20) resolve(seen);
        });
      }),
    any,
  );
  expect(n).toBe(20);
});

test('the native build runs the same pipeline on its store', async ({ page }) => {
  await page.goto('./native/?speed=10');
  await expect(page.locator('.build')).toHaveAttribute('data-build', 'native');
  const symbols = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const seen = new Set<string>();
        window.store.subscribe(
          'aggregates',
          (r) => {
            seen.add(r.value.symbol);
            if (seen.size === 3) resolve([...seen].toSorted());
          },
          'latest',
        );
      }),
  );
  expect(symbols).toEqual(['BTC-USD', 'ETH-USD', 'SOL-USD']);
});
