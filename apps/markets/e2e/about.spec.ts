import { expect, test } from '@playwright/test';

// "About this demo" (M3b task 19): the pipeline with each isolate's live state
// on Isoloop, "main thread" on native, and what the approach can't do.
test('isoloop: the pipeline shows each isolate running, and a crash', async ({ page }) => {
  await page.goto('/isoloop/?speed=10');
  await page.getByText('About this demo').click();
  const node = (id: string) => page.locator(`.about [data-node="${id}"] .state`);
  await Promise.all(
    ['replay', 'aggregator', 'alerts', 'price', 'trades'].map((id) =>
      expect(node(id)).toHaveText('running'),
    ),
  );
  await page.locator('[data-slot="price"] button[name="stress-crash"]').click();
  // The restart can be quicker than the panel's refresh, so count it from the kernel.
  await expect
    .poll(() =>
      page.evaluate(() => window.kernel.isolates().find((i) => i.id === 'price')?.restarts),
    )
    .toBeGreaterThanOrEqual(1);
  await expect(node('price')).toHaveText('running', { timeout: 15_000 });
  await expect(page.locator('.about')).toContainText('Alerts fire only while a tab is open.');
});

test('native: the same pipeline, all on the main thread', async ({ page }) => {
  await page.goto('/native/?speed=10');
  await page.getByText('About this demo').click();
  await expect(page.locator('.about [data-node="aggregator"] .state')).toHaveText('main thread');
  await expect(page.locator('.about [data-node="feed-okx"]')).toHaveCount(1);
});
