import { expect, test } from '@playwright/test';

// Installed from npm, built with @isoloop/vite, an isolate renders (M3b task 1).
test('an isolate from the npm packages renders on the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hello')).toHaveText('Hello from an isolate');
});
