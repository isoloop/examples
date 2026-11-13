import { expect, test } from '@playwright/test';
import { BUILDS, WEBKIT_STOPS, inScope, stopsOn } from './scope';

// Every page carries a plain-HTML notice and a classic feature check
// (shared/browser-check.ts), so a browser that can't run the app is told so
// instead of getting a blank page (seen on Safari 15, iPad Air 2).
const notice = '#browser-notice';

/** The feature each build checks that a stub can take away. */
const REMOVE: Record<(typeof BUILDS)[number], { code: string; named: RegExp }> = {
  isoloop: { code: 'delete window.OffscreenCanvas', named: /OffscreenCanvas/ },
  native: { code: 'delete Array.prototype.toSorted', named: /Array\.prototype\.toSorted/ },
  'native-workers': {
    code: 'delete Array.prototype.toSorted',
    named: /Array\.prototype\.toSorted/,
  },
};

for (const build of inScope(BUILDS)) {
  test(`${build}: the notice stays when the app's code can't load`, async ({ page }) => {
    await page.route('**/assets/**', (route) => route.abort());
    await page.goto(`./${build}/`);
    await expect(page.locator(notice)).toHaveText(/^Loading… If this message stays/);
    await expect(page.locator(notice)).toContainText('Safari 16.4');
  });

  test(`${build}: a missing feature is named and the app doesn't start`, async ({ page }) => {
    const { code, named } = REMOVE[build];
    await page.addInitScript(code);
    await page.goto(`./${build}/`);
    await expect(page.locator(notice)).toHaveText(/^Your browser isn't supported\./);
    await expect(page.locator(notice)).toContainText(named);
    await page.waitForTimeout(1_000);
    await expect(page.locator('.build')).toHaveCount(0);
  });

  test(`${build}: on a supported browser the notice goes once the app loads`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, build), WEBKIT_STOPS);
    await page.goto(`./${build}/`);
    await expect(page.locator('.build')).toHaveAttribute('data-build', build);
    await expect(page.locator(notice)).toHaveCount(0);
  });
}
