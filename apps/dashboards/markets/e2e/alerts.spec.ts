import { expect, test } from '@playwright/test';

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: a rule added in the editor fires on the replay source and shows in the panel`, async ({
    page,
  }) => {
    await page.goto(`/${build}/?size=lite&speed=10`);
    const panel = page.locator('[data-slot="alerts-panel"] .alerts');
    await expect(panel).toBeVisible();
    // BTC-USD trades far above 1, so the rule holds on its first value and fires once.
    await panel.getByLabel('Symbol').selectOption('BTC-USD');
    await panel.getByLabel('Metric').selectOption('price');
    await panel.getByLabel('Condition').selectOption('above');
    await panel.getByLabel('Threshold').fill('1');
    await panel.getByRole('button', { name: 'Add rule' }).click();
    await expect(panel.locator('.rules li')).toHaveCount(1);
    await expect(panel.locator('.fired li').first()).toContainText('BTC-USD price above 1', {
      timeout: 15_000,
    });
    // Removing it takes it out of the list.
    await panel.getByRole('button', { name: 'Remove rule' }).click();
    await expect(panel.locator('.rules li')).toHaveCount(0);
  });
}
