import { expect, test } from '@playwright/test';

const any = { '~standard': {} };

// The shared engines (M3c tasks 3 to 5) run at Normal: as headless isolates on
// Isoloop, as main-thread services on native, publishing the same streams.
test('isoloop: the stats engine publishes stats.v1 at Normal', async ({ page }) => {
  await page.goto('/isoloop/?size=normal&speed=10');
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const ids = window.kernel.isolates().map((i) => i.id);
          return ids.includes('engine-stats');
        }),
      { timeout: 10_000 },
    )
    .toBe(true);
  const symbols = await page.evaluate(
    (schema) =>
      new Promise<number>((resolve) => {
        const seen = new Set<string>();
        window.kernel.subscribe({ name: 'stats.v1', schema }, (r) => {
          seen.add((r.value as { symbol: string }).symbol);
          if (seen.size === 10) resolve(seen.size);
        });
      }),
    any,
  );
  expect(symbols).toBeGreaterThanOrEqual(10);
});

test('native: the stats engine publishes stats at Normal', async ({ page }) => {
  await page.goto('/native/?size=normal&speed=10');
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const seen = new Set<string>();
          const off = window.store.subscribe(
            'stats',
            (r) => {
              seen.add(r.value.symbol);
            },
            'earliest',
          );
          off();
          return seen.size;
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(10);
});

test('isoloop: Lite runs no engines', async ({ page }) => {
  await page.goto('/isoloop/?size=lite&speed=10');
  await page.waitForTimeout(1_000);
  const ids = await page.evaluate(() => window.kernel.isolates().map((i) => i.id));
  expect(ids.filter((id) => id.startsWith('engine-'))).toEqual([]);
});
