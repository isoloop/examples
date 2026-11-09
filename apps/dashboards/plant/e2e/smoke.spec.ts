import { expect, test } from '@playwright/test';

// Against the deployed copy (LIVE_URL, after each deploy): the root sends
// visitors to the Isoloop build, and every build loads.
test('the root sends visitors to the Isoloop build', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/isoloop\/$/);
  await expect(page.locator('.build')).toHaveAttribute('data-build', 'isoloop');
});

for (const build of ['native', 'native-workers']) {
  test(`the ${build} build loads`, async ({ page }) => {
    await page.goto(`./${build}/`);
    await expect(page.locator('.build')).toHaveAttribute('data-build', build);
  });
}
