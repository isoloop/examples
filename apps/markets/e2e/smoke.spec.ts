import { expect, test } from '@playwright/test';

// Installed from npm, built with @isoloop/vite, an isolate renders (M3b task 1).
test('an isolate from the npm packages renders on the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hello')).toHaveText('Hello from an isolate');
});

test('the replay source publishes trades to the bus', async ({ page }) => {
  await page.goto('/?speed=10');
  const n = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let seen = 0;
        window.kernel.subscribe({ name: 'trades.v1', schema: { '~standard': {} } }, () => {
          if (++seen === 20) resolve(seen);
        });
      }),
  );
  expect(n).toBe(20);
});
