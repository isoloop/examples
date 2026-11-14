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

const PAGES = ['/', '/features/', '/how-it-works/', '/examples/', '/__specimens/'];

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

const OFFSTAGE = 'iframe.ui-offstage[src="/examples/basic/?embed=1"]';

test('the landing recording draws what basic reports, and its controls reach basic', async ({
  page,
}) => {
  const problems = await watch(page);
  await page.goto('/');
  const rec = page.locator('[data-demo="recording"]');
  await rec.scrollIntoViewIfNeeded();
  // basic starts out of view, inert and hidden from assistive tech.
  await expect(page.locator(OFFSTAGE)).toHaveAttribute('aria-hidden', 'true');
  const status = rec.locator('.ui-status');
  await expect(status).toHaveText('Recording. Everything is running.', { timeout: 15_000 });
  const blockC = rec.getByRole('button', { name: 'Block C for 3 s' });
  await expect(blockC).toBeEnabled({ timeout: 15_000 });
  await blockC.click();
  await expect(status).toContainText('C is stuck', { timeout: 5_000 });
  await expect(status).toContainText('the pool was stopped and started again', { timeout: 10_000 });
  // It really happened in basic: C and D restarted, A didn't.
  const basic = page.frameLocator(OFFSTAGE);
  const restarts = (id: string) => basic.locator(`section[data-isolate="${id}"] .restarts`);
  await expect(restarts('C')).toHaveText('restarts: 1');
  await expect(restarts('D')).toHaveText('restarts: 1');
  await expect(restarts('A')).toHaveText('restarts: 0');
  // The isolates' errors are the crash basic was asked for; nothing else may go wrong.
  expect((await problems()).filter((e) => !/crash|unresponsive/i.test(e))).toEqual([]);
});

test('the recording ignores a message that is not from its own basic', async ({ page }) => {
  await page.goto('/');
  const rec = page.locator('[data-demo="recording"]');
  await rec.scrollIntoViewIfNeeded();
  const status = rec.locator('.ui-status');
  await expect(status).toHaveText('Recording. Everything is running.', { timeout: 15_000 });
  // A sandboxed frame (another origin, another window) claims A crashed.
  await page.evaluate(() => {
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts');
    f.srcdoc =
      "<script>parent.postMessage({ v: 'isoloop-demo@1', type: 'crash', id: 'A', pool: null, at: Date.now() }, '*');</" +
      'script>';
    document.body.append(f);
  });
  // And the page itself posts one: right origin, wrong window.
  await page.evaluate(() => {
    window.postMessage(
      { v: 'isoloop-demo@1', type: 'crash', id: 'A', pool: null, at: Date.now() },
      '*',
    );
  });
  await page.waitForTimeout(1_000);
  await expect(status).not.toContainText('A crashed');
});

test('/features/ shows basic’s real records, reads and a replay after a crash', async ({
  page,
}) => {
  const problems = await watch(page);
  await page.goto('/features/');
  const bus = page.locator('[data-demo="bus"]');
  await bus.scrollIntoViewIfNeeded();
  await expect(bus.locator('.topic[data-topic="count.v1"] .rec').first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(bus.locator('.topic[data-topic="note.v1"] .rec').first()).toBeVisible({
    timeout: 15_000,
  });
  // D's reads are tagged on the records it read.
  await expect(bus.locator('.rec .tags b[data-reader="D"]').first()).toBeVisible({
    timeout: 10_000,
  });

  const replay = page.locator('[data-demo="replay"]');
  await replay.scrollIntoViewIfNeeded();
  await expect(replay.locator('.tape-cells li.read').first()).toBeVisible({ timeout: 15_000 });
  const crashD = replay.getByRole('button', { name: 'Crash D' });
  await expect(crashD).toBeEnabled();
  await crashD.click();
  const status = replay.locator('.ui-status');
  await expect(status).toContainText(/D read \d+ notes? again/, { timeout: 10_000 });
  await expect(replay.locator('.tape-cells li.again').first()).toBeVisible();
  expect((await problems()).filter((e) => !/crash/i.test(e))).toEqual([]);
});

test('the framework tabs work with the keyboard', async ({ page }) => {
  await page.goto('/features/#frameworks');
  const react = page.getByRole('tab', { name: 'React', exact: true });
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await react.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Preact', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('#panel-preact')).toBeVisible();
  await expect(page.locator('#panel-react')).toBeHidden();
});

test('the theme switch changes the page and the diagram frames live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/how-it-works/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const first = page.locator('iframe[src^="/how-it-works/diagrams/"]').first();
  const frame = first.contentFrame();
  await first.scrollIntoViewIfNeeded();
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
  const toggle = page.getByRole('switch', { name: 'Dark theme' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
});
