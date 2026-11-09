import { expect, test, type Page } from '@playwright/test';
import { WEBKIT_STOPS, stopsOn } from './scope';

// M3d decision 8: each header says where its widget runs, and its updates/s.
const where = (page: Page, slot: string) =>
  page.locator(`[data-slot="${slot}"] [data-head="where"]`);

const CASES: [url: string, slot: string, label: RegExp][] = [
  ['/isoloop/?placement=split', 'T3-spectrum', /^pool T3$/],
  ['/isoloop/?placement=split', 'fleet-status', /^pool fleet$/],
  ['/isoloop/?placement=machine', 'T5-events', /^pool T5$/],
  ['/isoloop/?placement=shared-engines', 'T2-gauges', /^pool T2$/],
  ['/isoloop/?placement=own', 'T8-sensors', /^worker \d+$/],
  ['/native/', 'T1-waveform', /^main thread$/],
  ['/native-workers/', 'fleet-trend', /^main thread$/],
];

for (const [url, slot, label] of CASES) {
  test(`${url} ${slot}: the header says where it runs, and its updates/s`, async ({
    page,
    browserName,
  }) => {
    test.skip(stopsOn(browserName, url.split('/')[1] ?? ''), WEBKIT_STOPS);
    await page.goto(url);
    await expect(where(page, slot)).toHaveText(label);
    await expect(page.locator(`[data-slot="${slot}"] [data-head="updates"]`)).toHaveText(
      /^\d+ updates\/s$/,
      { timeout: 15_000 },
    );
  });
}
