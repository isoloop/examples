import { expect, test, type Page } from '@playwright/test';
import { WEBKIT_STOPS } from './scope';

// M3d task 10: Isoloop's input budget in its default placement (matched) at
// each rate (decision 12), as a regression check. Each test types into T1's
// event log filter, a widget, on the Isoloop build and then on both native
// builds, one page after the other. Isoloop's median is asserted; the native
// medians and the ratios go to the report, not asserted. The numbers to quote
// come from the recorded comparison (task 11), not from here.
const INPUT_BUDGET_MS = 200;
const SCALE = Number(process.env['PERF_BUDGET_SCALE'] ?? '1');
const SAMPLES = 5;
const FULL = process.env['E2E_HEAVY'] === '1' || !process.env['CI'];
const RATES = FULL ? [1, 2, 5] : [1];

const median = (xs: number[]): number =>
  xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

const filter = (page: Page) => page.locator('[data-slot="T1-events"] input[name="event-text"]');
const rendered = (page: Page) => page.locator('[data-slot="T1-events"] .events');

/** Types into the cleared filter and times until the widget has rendered the text. */
async function latency(page: Page, text: string): Promise<number> {
  await filter(page).fill('');
  await expect(rendered(page)).toHaveAttribute('data-filter', '', { timeout: 30_000 });
  const t0 = Date.now();
  await filter(page).fill(text);
  await expect(rendered(page)).toHaveAttribute('data-filter', text, { timeout: 30_000 });
  return Date.now() - t0;
}

async function measure(page: Page, build: string, rate: number): Promise<number> {
  await page.goto(`/${build}/?rate=${rate}&seed=7`);
  await expect(page.locator('[data-metric="first-data"] dd')).toHaveText(/ms$/, {
    timeout: 30_000,
  });
  await latency(page, 'x'); // warm up
  const xs: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    // oxlint-disable-next-line no-await-in-loop
    xs.push(await latency(page, `x${i}`));
  }
  return median(xs);
}

for (const rate of RATES) {
  test(`isoloop at ${rate} kHz: typing stays within the input budget (native builds reported)`, async ({
    page,
    browserName,
  }, info) => {
    // Report-only on WebKit: in the default placement (matched) Playwright's
    // WebKit kept within the budget on the CI runner but stopped on a 32-core
    // machine (engine constraint 2), so it's recorded, not asserted.
    const reportOnly = browserName === 'webkit';
    test.setTimeout(150_000);
    let iso: number;
    try {
      iso = await measure(page, 'isoloop', rate);
    } catch (e) {
      if (!reportOnly) throw e;
      info.annotations.push({ type: 'webkit', description: `${WEBKIT_STOPS} (${rate} kHz)` });
      console.log(`[budget] {"rate":${rate},"isoloop":"stopped","engine":"webkit"}`);
      return;
    }
    const native = await measure(page, 'native', rate);
    const workers = await measure(page, 'native-workers', rate);
    const report = {
      rate,
      isoloopMedianMs: iso,
      nativeMedianMs: native,
      nativeWorkersMedianMs: workers,
      ratioToNative: native > 0 ? iso / native : null,
      ratioToNativeWorkers: workers > 0 ? iso / workers : null,
    };
    info.annotations.push({
      type: 'input latency',
      description: `${rate} kHz: isoloop ${iso} ms, native ${native} ms, native + workers ${workers} ms`,
    });
    await info.attach('input-latency.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
    console.log(`[budget] ${JSON.stringify(report)}`);
    if (reportOnly) return;
    expect(
      iso,
      `isoloop at ${rate} kHz: ${iso} ms > ${INPUT_BUDGET_MS} ms × ${SCALE} = ${INPUT_BUDGET_MS * SCALE} ms`,
    ).toBeLessThanOrEqual(INPUT_BUDGET_MS * SCALE);
  });
}
