import { expect, test } from '@playwright/test';

// Against the deployed copy (LIVE_URL, after each deploy): basic starts.
test('basic starts all four isolates', async ({ page }) => {
  await page.goto('./');
  await Promise.all(
    ['A', 'B', 'C', 'D'].map((id) =>
      expect(page.locator(`section[data-isolate="${id}"] .status`)).toContainText('loop ok', {
        timeout: 15_000,
      }),
    ),
  );
});
