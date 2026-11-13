import { expect, test } from '@playwright/test';
import { inScope } from './scope';

// Every page carries a plain-HTML notice and a classic feature check
// (shared/browser-check.ts), so a browser that can't run the app is told so
// instead of getting a blank page (seen on Safari 15, iPad Air 2).
const notice = '#browser-notice';

const BUILDS = ['isoloop', 'native', 'isoloop-preact', 'native-preact', 'mixed'] as const;
const native = (b: string): boolean => b.startsWith('native');

for (const build of inScope(BUILDS)) {
  test(`${build}: the notice stays when the app's code can't load`, async ({ page }) => {
    await page.route('**/assets/**', (route) => route.abort());
    await page.goto(`./${build}/`);
    await expect(page.locator(notice)).toHaveText(/^Loading… If this message stays/);
    await expect(page.locator(notice)).toContainText('Safari 16.4');
  });

  test(`${build}: a missing feature is named and the app doesn't start`, async ({ page }) => {
    await page.addInitScript(
      native(build) ? 'delete Array.prototype.toSorted' : 'delete window.OffscreenCanvas',
    );
    await page.goto(`./${build}/`);
    await expect(page.locator(notice)).toHaveText(/^Your browser isn't supported\./);
    await expect(page.locator(notice)).toContainText(
      native(build) ? 'Array.prototype.toSorted' : 'OffscreenCanvas',
    );
    await page.waitForTimeout(1_000);
    await expect(page.locator('.build')).toHaveCount(0);
  });

  test(`${build}: on a supported browser the notice goes once the app loads`, async ({ page }) => {
    await page.goto(`./${build}/`);
    // `data-build` is the build's kind (isoloop or native), so the header's
    // presence is the check.
    await expect(page.locator('.build')).toBeVisible();
    await expect(page.locator(notice)).toHaveCount(0);
  });
}
