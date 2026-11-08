import { expect, test, type Page } from '@playwright/test';
import { inScope } from './scope';

// M3c task 6: the canvas widgets on the shared engines, at Normal. At the
// size's own rate (speed=1): at 10× a 4-core CI runner can't keep up with 22
// isolates per page in parallel pages.
const WIDGETS = {
  sparklines: /^20 sparklines$/,
  vwap: /^\d+ points$/,
  volatility: /^20 bars$/,
  'volume-profile': /^24 bars$/,
  correlations: /^20×20$/,
  depth: /^40×\d+$/,
} as const;

const drawn = (page: Page, slot: string) =>
  page.locator(`[data-slot="${slot}"] canvas`).getAttribute('data-drawn');

for (const build of inScope([
  'isoloop',
  'native',
  'isoloop-preact',
  'native-preact',
  'mixed',
] as const)) {
  test(`${build}: every canvas widget draws its data at Normal`, async ({ page }) => {
    await page.goto(`/${build}/?size=normal&speed=1`);
    // Engines publish once a second; the stats and correlations need a few seconds of trades.
    await Promise.all(
      Object.entries(WIDGETS).map(async ([slot, shape]) =>
        expect.poll(async () => drawn(page, slot), { timeout: 15_000 }).toMatch(shape),
      ),
    );
  });
}

test('Isoloop and native draw the same shapes from the same replay', async ({ browser }) => {
  // Two pages one after the other; on WebKit the Isoloop page can take longer
  // than 15 s before every symbol has the trades the correlations need.
  test.setTimeout(90_000);
  const shapes = async (build: string): Promise<string[]> => {
    const page = await browser.newPage();
    await page.goto(`/${build}/?size=normal&speed=1&seed=5`);
    const out = await Promise.all(
      Object.entries(WIDGETS).map(async ([slot, shape]) => {
        await expect.poll(async () => drawn(page, slot), { timeout: 30_000 }).toMatch(shape);
        // depth's column count and vwap's point count grow with time; compare the fixed part.
        return `${slot}:${(await drawn(page, slot))?.replace(/×\d+$|^\d+ points$/, '') ?? ''}`;
      }),
    );
    await page.close();
    return out;
  };
  expect(await shapes('isoloop')).toEqual(await shapes('native'));
});
