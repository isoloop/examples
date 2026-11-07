import { expect, test } from '@playwright/test';
import { inScope } from './scope';

const BUILDS = inScope(['isoloop', 'native', 'isoloop-preact', 'native-preact', 'mixed'] as const);

// The size switch (M3c task 1) reloads into the chosen size on every build.
for (const build of BUILDS) {
  test(`${build}: the size switch reloads into the chosen size`, async ({ page }) => {
    await page.goto(`/${build}/?speed=10`);
    const grid = page.locator('main.grid');
    await expect(grid).toHaveAttribute('data-size', 'normal');
    const sizes = page.getByRole('navigation', { name: 'Dashboard size' });
    await expect(sizes.locator('[aria-current="page"]')).toHaveText('Normal');

    await sizes.getByRole('link', { name: 'Lite' }).click();
    await expect(page).toHaveURL(/size=lite/);
    await expect(grid).toHaveAttribute('data-size', 'lite');
    await expect(page.locator('[data-slot="price"] canvas')).toBeVisible();

    await sizes.getByRole('link', { name: 'Heavy' }).click();
    await expect(page).toHaveURL(/size=heavy/);
    await expect(grid).toHaveAttribute('data-size', 'heavy');
  });
}

test('the toggle keeps the size', async ({ page }) => {
  await page.goto('/isoloop/?size=lite&speed=10');
  await page.getByRole('link', { name: 'Switch to native' }).click();
  await expect(page).toHaveURL(/\/native\/\?.*size=lite/);
  await expect(page.locator('main.grid')).toHaveAttribute('data-size', 'lite');
});
