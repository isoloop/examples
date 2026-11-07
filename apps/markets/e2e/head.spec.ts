import { expect, test, type Locator, type Page } from '@playwright/test';
import { inScope } from './scope';

// M3c task 9b: each widget's header shows where it runs and its updates/s,
// and its stress controls sit in that row.
const BUILDS = ['isoloop', 'native', 'isoloop-preact', 'native-preact', 'mixed'] as const;
const WHERE: Record<(typeof BUILDS)[number], RegExp> = {
  isoloop: /^worker \d+$/,
  native: /^main thread$/,
  'isoloop-preact': /^worker \d+$/,
  'native-preact': /^main thread$/,
  mixed: /^worker \d+ · (React|Preact)$/,
};

const head = (page: Page, slot: string): Locator =>
  page.locator(`[data-slot="${slot}"] .widget-head`);
const updates = (page: Page, slot: string): Locator =>
  head(page, slot).locator('[data-head="updates"]');
const count = async (l: Locator): Promise<number> =>
  Number((await l.innerText()).replace(/\D+/g, '') || 'NaN');

for (const build of inScope(BUILDS)) {
  test(`${build}: every widget's header shows where it runs and its updates/s`, async ({
    page,
  }) => {
    await page.goto(`/${build}/?size=lite&speed=1`);
    const slots = await page
      .locator('[data-slot]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-slot') ?? ''));
    expect(slots.length).toBeGreaterThan(0);
    await Promise.all(
      slots.flatMap((slot) => [
        expect(head(page, slot).locator('[data-head="where"]')).toHaveText(WHERE[build]),
        expect(updates(page, slot)).toHaveText(/^\d+ updates\/s$/, { timeout: 15_000 }),
      ]),
    );
    // The price chart draws on every trade, so it reports updates.
    await expect.poll(() => count(updates(page, 'price')), { timeout: 15_000 }).toBeGreaterThan(0);
    // The stress controls sit in the header's row, not over the widget.
    const row = await head(page, 'price').boundingBox();
    const block = await page
      .locator('[data-slot="price"] button[name="stress-block"]')
      .boundingBox();
    expect(row).not.toBeNull();
    expect(block).not.toBeNull();
    if (row && block) {
      expect(block.y).toBeGreaterThanOrEqual(row.y);
      expect(block.y + block.height).toBeLessThanOrEqual(row.y + row.height + 1);
    }
  });
}

for (const build of inScope(['isoloop', 'isoloop-preact', 'mixed'] as const)) {
  test(`${build}: a blocked widget's header shows 0 updates/s while a neighbour keeps updating`, async ({
    page,
  }) => {
    await page.goto(`/${build}/?size=lite&speed=1`);
    await expect.poll(() => count(updates(page, 'price')), { timeout: 15_000 }).toBeGreaterThan(0);
    await expect.poll(() => count(updates(page, 'trades')), { timeout: 15_000 }).toBeGreaterThan(0);
    await page.locator('[data-slot="price"] button[name="stress-block"]').click();
    // The block lasts 3 s; the widget's report counts as late after 1.5 s.
    await expect(updates(page, 'price')).toHaveText('0 updates/s', { timeout: 2_900 });
    expect(await count(updates(page, 'trades'))).toBeGreaterThan(0);
    // It counts again once its loop is free.
    await expect.poll(() => count(updates(page, 'price')), { timeout: 10_000 }).toBeGreaterThan(0);
  });
}
