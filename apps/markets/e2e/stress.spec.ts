import { expect, test, type Locator, type Page } from '@playwright/test';

/** The "good" input-latency threshold (INP ≤ 200 ms, design §9). */
const INPUT_BUDGET_MS = 200;
/**
 * CI runners are shared and slower than a developer machine, so CI sets
 * `PERF_BUDGET_SCALE=2`; locally the budget applies as stated. The published
 * numbers come from the comparison, not from these checks.
 */
const SCALE = Number(process.env.PERF_BUDGET_SCALE ?? '1');
const withinBudget = (ms: number): void => {
  expect(
    ms,
    `${Math.round(ms)} ms > ${INPUT_BUDGET_MS} ms × ${SCALE} = ${INPUT_BUDGET_MS * SCALE} ms`,
  ).toBeLessThanOrEqual(INPUT_BUDGET_MS * SCALE);
};
const BLOCK_MS = 3_000;

const slot = (page: Page, name: string): Locator => page.locator(`[data-slot="${name}"]`);
const stress = (page: Page, name: string, what: 'block' | 'crash' | 'flood'): Locator =>
  slot(page, name).locator(`button[name="stress-${what}"]`);

/** Types into the alerts panel and times until it re-renders (Add rule enabled). */
async function inputLatency(page: Page, text: string): Promise<number> {
  const panel = slot(page, 'alerts-panel');
  const input = panel.getByLabel('Threshold');
  const add = panel.getByRole('button', { name: 'Add rule' });
  await input.fill('');
  await expect(add).toBeDisabled();
  const t0 = Date.now();
  await input.fill(text);
  await expect(add).toBeEnabled({ timeout: 10_000 });
  return Date.now() - t0;
}

/** Waits until a chart's pixels change. */
async function draws(page: Page, name: string): Promise<void> {
  const canvas = slot(page, name).locator('canvas');
  const before = await canvas.screenshot();
  await expect
    .poll(async () => Buffer.compare(await canvas.screenshot(), before) !== 0, { timeout: 10_000 })
    .toBe(true);
}

test.describe('isoloop', () => {
  test('blocking one chart keeps input on the others within budget, and shows it busy', async ({
    page,
  }) => {
    await page.goto('/isoloop/?size=lite&speed=10');
    await inputLatency(page, '1'); // warm up
    await stress(page, 'price', 'block').click();
    const ms = await inputLatency(page, '2');
    withinBudget(ms);
    // The host's busy overlay (its text is CSS content), within design §9's 500 ms plus slack.
    await expect(slot(page, 'price').locator('.iso-busy')).toBeVisible({ timeout: 1_500 });
    await draws(page, 'spread');
  });

  test('a crashed chart leaves the others drawing, and comes back', async ({ page }) => {
    await page.goto('/isoloop/?size=lite&speed=10');
    await draws(page, 'price');
    await stress(page, 'price', 'crash').click();
    await Promise.all([draws(page, 'spread'), draws(page, 'volume')]);
    // The host restarts the isolate, which draws again.
    await expect(slot(page, 'price').locator('canvas')).toBeVisible({ timeout: 10_000 });
    await draws(page, 'price');
  });
});

test.describe('native', () => {
  test('blocking one chart freezes the whole page', async ({ page }) => {
    await page.goto('/native/?size=lite&speed=10');
    await inputLatency(page, '1');
    const t0 = Date.now();
    // The click runs the busy loop on the main thread; nothing else runs until it ends.
    await stress(page, 'price', 'block').click();
    await inputLatency(page, '2');
    expect(Date.now() - t0).toBeGreaterThanOrEqual(BLOCK_MS - 100);
  });

  test('a crashed chart shows its error boundary, and the others keep drawing', async ({
    page,
  }) => {
    await page.goto('/native/?size=lite&speed=10');
    await stress(page, 'price', 'crash').click();
    await expect(slot(page, 'price')).toContainText('price crashed');
    await Promise.all([draws(page, 'spread'), draws(page, 'volume')]);
  });
});

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: a flood from one widget keeps input on the others within budget`, async ({
    page,
  }) => {
    await page.goto(`/${build}/?size=lite&speed=10`);
    await inputLatency(page, '1');
    await stress(page, 'trades', 'flood').click();
    await expect(stress(page, 'trades', 'flood')).toHaveAttribute('aria-pressed', 'true');
    const ms = await inputLatency(page, '2');
    withinBudget(ms);
    await draws(page, 'spread');
  });
}
