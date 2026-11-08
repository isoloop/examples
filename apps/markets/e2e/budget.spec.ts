import { expect, test, type Locator, type Page } from '@playwright/test';
import { inScope } from './scope';

// M3c task 11: Isoloop's input budget at each size CI runs (decision 11).
// Each test types into the alerts panel on a build pair, Isoloop's build and
// its native counterpart, one after the other in the same test. Isoloop's
// median is asserted against the budget, as a regression check; native's
// median and the ratio are written to the report, not asserted. The numbers
// to quote come from the recorded comparison, not from here.
const INPUT_BUDGET_MS = 200;
const SCALE = Number(process.env.PERF_BUDGET_SCALE ?? '1');
const SAMPLES = 5;
const HEAVY = process.env['E2E_HEAVY'] === '1' || !process.env['CI'];
const SIZES = ['lite', 'normal', ...(HEAVY ? (['heavy'] as const) : [])] as const;
const PAIRS = inScope(['isoloop', 'isoloop-preact'] as const).map(
  (isoloop) => [isoloop, isoloop === 'isoloop' ? 'native' : 'native-preact'] as const,
);

// Known over budget on Playwright's WebKit (Linux, no GPU): presenting the
// canvases workers draw takes the main thread, so typing waits. Measured on the
// 4-core CI runner (Weekly run 42464452395, budget 400 ms with the ×2 scale):
// isoloop-preact at Normal 436–548 ms; both Isoloop builds at Heavy time out.
// isoloop at Normal (373–419 ms) sits at the budget and stays asserted. These
// are marked expected to fail, not skipped: they still run, report their
// numbers, and turn red if WebKit gets within budget. See
// https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md
const WEBKIT_OVER_BUDGET = new Set([
  'isoloop-preact@normal',
  'isoloop@heavy',
  'isoloop-preact@heavy',
]);
const ENGINE_CONSTRAINTS =
  'https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md';

const median = (xs: number[]): number =>
  xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

function alerts(page: Page): { input: Locator; add: Locator } {
  const panel = page.locator('[data-slot="alerts-panel"]');
  return {
    input: panel.getByLabel('Threshold'),
    add: panel.getByRole('button', { name: 'Add rule' }),
  };
}

/** Types into a cleared threshold and times until the panel re-renders ("Add rule" enabled). */
async function latency(page: Page, text: string): Promise<number> {
  const { input, add } = alerts(page);
  await input.fill('');
  await expect(add).toBeDisabled({ timeout: 30_000 });
  const t0 = Date.now();
  await input.fill(text);
  await expect(add).toBeEnabled({ timeout: 30_000 });
  return Date.now() - t0;
}

/** The median of SAMPLES keystrokes on a build at a size, after the page has data and a warm-up. */
async function measure(page: Page, build: string, size: string): Promise<number> {
  await page.goto(`/${build}/?size=${size}&speed=1&seed=7`);
  await expect(page.locator('[data-metric="first-data"] dd')).toHaveText(/ms$/, {
    timeout: 30_000,
  });
  await latency(page, '0'); // warm up
  const xs: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    // oxlint-disable-next-line no-await-in-loop
    xs.push(await latency(page, String(i + 1)));
  }
  return median(xs);
}

for (const size of SIZES) {
  for (const [isoloop, native] of PAIRS) {
    test(`${isoloop} at ${size}: typing stays within the input budget (${native} reported)`, async ({
      page,
      browserName,
    }, info) => {
      test.setTimeout(120_000);
      test.fail(
        browserName === 'webkit' && WEBKIT_OVER_BUDGET.has(`${isoloop}@${size}`),
        `Known over budget on WebKit: worker canvases are presented on the main thread (${ENGINE_CONSTRAINTS})`,
      );
      const iso = await measure(page, isoloop, size);
      const nat = await measure(page, native, size);
      const ratio = nat > 0 ? iso / nat : null;
      const report = { size, isoloop, native, isoloopMedianMs: iso, nativeMedianMs: nat, ratio };
      info.annotations.push({
        type: 'input latency',
        description: `${size}: ${isoloop} ${iso} ms, ${native} ${nat} ms, ratio ${ratio === null ? 'n/a' : ratio.toFixed(2)}`,
      });
      await info.attach('input-latency.json', {
        body: JSON.stringify(report, null, 2),
        contentType: 'application/json',
      });
      console.log(`[budget] ${JSON.stringify(report)}`);
      expect(
        iso,
        `${isoloop} at ${size}: ${iso} ms > ${INPUT_BUDGET_MS} ms × ${SCALE} = ${INPUT_BUDGET_MS * SCALE} ms`,
      ).toBeLessThanOrEqual(INPUT_BUDGET_MS * SCALE);
    });
  }
}
