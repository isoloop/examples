import { expect, test, type Page } from '@playwright/test';

const ROW = 22;

/** Waits two animation frames, the most the viewport may stay empty. */
const twoFrames = (page: Page): Promise<void> =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );

for (const build of ['isoloop', 'native'] as const) {
  test(`${build}: scrolling 10,000 rows renders only the visible ones, never an empty viewport`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    // 25 trades a second per exchange and symbol at 10× (3,000/s in all): BTC-USD fills
    // 10,000 rows in about 10 s, without starving a 4-core CI runner shared with other tests.
    await page.goto(`/${build}/?speed=10&tps=25`);
    const table = page.locator('[data-slot="trades"] .trades');
    const inner = table.locator('.trades-inner');
    await expect
      .poll(async () => (await inner.boundingBox())?.height ?? 0, { timeout: 30_000 })
      .toBeGreaterThanOrEqual(10_000 * ROW);

    const viewport = (await table.boundingBox())?.height ?? 0;
    expect(viewport).toBeGreaterThan(100);
    for (const top of [0, 40_000, 110_000, 200_000, 60_000]) {
      // oxlint-disable-next-line no-await-in-loop -- each step scrolls, then checks that position
      await table.evaluate((el, t) => {
        el.scrollTop = t;
      }, top);
      // oxlint-disable-next-line no-await-in-loop -- see above
      await twoFrames(page);
      // oxlint-disable-next-line no-await-in-loop -- see above
      const shown = await table.evaluate((el, row) => {
        const box = el.getBoundingClientRect();
        const rows = [...el.querySelectorAll<HTMLElement>('.trade')];
        const inView = rows.filter((r) => {
          const b = r.getBoundingClientRect();
          return b.bottom > box.top && b.top < box.bottom;
        });
        return { rendered: rows.length, inView: inView.length, full: Math.floor(box.height / row) };
      }, ROW);
      expect(shown.rendered).toBeLessThan(60);
      expect(shown.inView).toBeGreaterThanOrEqual(shown.full);
    }
  });
}
