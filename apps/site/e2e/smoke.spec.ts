import { expect, test, type Page } from '@playwright/test';
import { DIAGRAM_ORDER } from '../build/diagrams.ts';
import { expectAccessible } from './accessible.ts';

declare global {
  interface Window {
    cspViolations?: string[];
  }
}

// The site's smoke test (ADR 0002, decision 11), against the assembled site as
// it's deployed (scripts/assemble-site.sh with SITE=1), served the way GitHub
// Pages serves it (scripts/serve.ts), plus ui's specimens under /__specimens/.

/** Console errors and CSP violations on a page, collected from before it loads. */
async function watch(page: Page): Promise<() => Promise<string[]>> {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const seen: string[] = [];
    window.cspViolations = seen;
    document.addEventListener('securitypolicyviolation', (e) => {
      seen.push(`${e.violatedDirective}: ${e.blockedURI || 'inline'}`);
    });
  });
  return async () => {
    const csp = await page.evaluate(() => window.cspViolations ?? []);
    return [...errors, ...csp.map((v) => `CSP ${v}`)];
  };
}

const PAGES = ['/', '/how-it-works/', '/examples/', '/__specimens/'];

for (const path of PAGES) {
  test(`${path} loads cleanly and is accessible`, async ({ page }) => {
    const problems = await watch(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    // The iframes are checked as pages of their own (basic in its own E2E,
    // the diagrams below); here axe looks at this page's markup.
    await expectAccessible(page, { exclude: ['iframe'] });
    expect(await problems()).toEqual([]);
  });
}

test('a missing page gets the 404 page', async ({ page }) => {
  const problems = await watch(page);
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('doesn’t exist');
  await expectAccessible(page);
  // The browser logs the 404 itself; nothing else may go wrong.
  expect((await problems()).filter((e) => !/status of 404/.test(e))).toEqual([]);
});

for (const name of DIAGRAM_ORDER) {
  test(`the ${name} diagram runs under the site's policy`, async ({ page }) => {
    const problems = await watch(page);
    const res = await page.goto(`/how-it-works/diagrams/${name}.html`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('svg').first()).toBeVisible();
    // The theme script is there and in charge of data-theme.
    await page.evaluate(() => localStorage.setItem('isoloop-theme', 'dark'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await problems()).toEqual([]);
  });
}

test('the landing page embeds basic, which boots and restarts a crashed isolate', async ({
  page,
}) => {
  const problems = await watch(page);
  await page.goto('/');
  const iframe = page.locator('iframe[src="/examples/basic/?embed=1"]');
  await iframe.scrollIntoViewIfNeeded();
  const basic = page.frameLocator('iframe[src="/examples/basic/?embed=1"]');
  const pane = (id: string) => basic.locator(`section[data-isolate="${id}"]`);
  await Promise.all(
    ['A', 'B', 'C', 'D'].map((id) =>
      expect(pane(id).locator('.status')).toContainText('loop ok', { timeout: 15_000 }),
    ),
  );
  // Embedded: no header inside the frame.
  await expect(basic.locator('header.ui-header')).toBeHidden();
  await pane('C').locator('.pane-body').getByRole('button', { name: 'Crash', exact: true }).click();
  await expect(pane('C').locator('.restarts')).toHaveText('restarts: 1', { timeout: 5_000 });
  await expect(pane('C').locator('.status')).toContainText('loop ok', { timeout: 15_000 });
  await expect(pane('D').locator('.restarts')).toHaveText('restarts: 0');
  // basic reports the crash it was asked for; nothing else may go wrong.
  expect((await problems()).filter((e) => !/crash/i.test(e))).toEqual([]);
});

test('the theme toggle switches the page and the embedded frames live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const frame = page.frameLocator('iframe[src="/examples/basic/?embed=1"]');
  await page.locator('iframe[src="/examples/basic/?embed=1"]').scrollIntoViewIfNeeded();
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
});
