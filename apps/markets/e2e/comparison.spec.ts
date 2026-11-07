import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

// The recorded comparison (M3b task 18): one scripted scenario on the replay
// source, run on each build. The React pair is the headline (and the video),
// the Preact pair a second table. `scripts/compare.ts` turns the results into
// the table and the side-by-side video.
//
// The scenario: the replay at 10×; type into the alerts panel while it's calm,
// then while one chart runs a 3 s busy loop, with the table flooding the bus.
// Each stressed sample starts its own block and types 200 ms into it.
// Input latency is measured end to end: from typing to the panel re-rendering
// (its "Add rule" button enabling), which is what a user waits for.
const OUT = 'comparison-results';
const BUILDS = ['native', 'isoloop', 'native-preact', 'isoloop-preact'] as const;
const SAMPLES = 5;
const BLOCK_MS = 3_000;

const slot = (page: Page, name: string): Locator => page.locator(`[data-slot="${name}"]`);
const metric = async (page: Page, key: string): Promise<string> =>
  (await page.locator(`[data-metric="${key}"] dd`).textContent()) ?? '';

function alerts(page: Page): { input: Locator; add: Locator } {
  const panel = slot(page, 'alerts-panel');
  return {
    input: panel.getByLabel('Threshold'),
    add: panel.getByRole('button', { name: 'Add rule' }),
  };
}

/** Empties the threshold, so the next typing enables "Add rule". */
async function clear(page: Page): Promise<void> {
  const { input, add } = alerts(page);
  await input.fill('');
  await expect(add).toBeDisabled({ timeout: 30_000 });
}

/** Types into a cleared threshold and times until the panel re-renders. */
async function typed(page: Page, text: string): Promise<number> {
  const { input, add } = alerts(page);
  const t0 = Date.now();
  await input.fill(text);
  await expect(add).toBeEnabled({ timeout: 30_000 });
  return Date.now() - t0;
}

async function typeLatency(page: Page, text: string): Promise<number> {
  await clear(page);
  return typed(page, text);
}

async function samples(page: Page): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    // oxlint-disable-next-line no-await-in-loop
    out.push(await typeLatency(page, String(i + 1)));
  }
  return out;
}

test.use({
  video: { mode: 'on', size: { width: 960, height: 600 } },
  viewport: { width: 960, height: 600 },
});

for (const build of BUILDS) {
  test(`comparison: ${build}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`/${build}/?size=lite&speed=10&seed=7`);
    await expect(page.locator('[data-metric="first-data"] dd')).toHaveText(/ms$/, {
      timeout: 15_000,
    });
    await page.waitForTimeout(2_000);
    await typeLatency(page, '0'); // warm up
    const calm = await samples(page);
    await slot(page, 'trades').locator('button[name="stress-flood"]').click();
    const block = slot(page, 'price').locator('button[name="stress-block"]');
    const stressed: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      // Clicked from a timer, not awaited: Playwright's click would wait the
      // busy loop out, and the sample would then be taken after it.
      // oxlint-disable-next-line no-await-in-loop
      await clear(page);
      // oxlint-disable-next-line no-await-in-loop
      await block.evaluate((el: HTMLElement) => setTimeout(() => el.click(), 0));
      const started = Date.now();
      // oxlint-disable-next-line no-await-in-loop
      await page.waitForTimeout(200);
      // oxlint-disable-next-line no-await-in-loop
      stressed.push(await typed(page, String(i + 1)));
      // oxlint-disable-next-line no-await-in-loop
      await page.waitForTimeout(Math.max(0, BLOCK_MS + 300 - (Date.now() - started)));
    }
    const result = {
      build,
      calm,
      stressed,
      fps: await metric(page, 'fps'),
      longTasks: await metric(page, 'long-tasks'),
      firstData: await metric(page, 'first-data'),
      bundle: await metric(page, 'bundle'),
    };
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${build}.json`, `${JSON.stringify(result, null, 2)}\n`);
    const video = page.video();
    await page.close();
    if (video) copyFileSync(await video.path(), `${OUT}/${build}.webm`);
  });
}
