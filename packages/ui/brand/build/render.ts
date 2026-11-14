// Renders the raster brand files with Playwright: the favicon PNGs from the
// SVGs, and the social cards from social/cards.html. Run after brand:marks:
//   pnpm --filter ui brand:render
import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 2400 } });

// A file:// page may load the SVGs; a blank page may not.
await page.goto(pathToFileURL(join(DIR, 'social/cards.html')).href);
const icons: [number, string, string][] = [
  [32, 'favicon-32.png', 'favicon.svg'],
  // The square app tile: iOS expects an opaque square and masks it itself.
  [180, 'apple-touch-icon-180.png', 'apple-touch-icon.svg'],
];
for (const [size, name, src] of icons) {
  // oxlint-disable-next-line no-await-in-loop -- one page, one image at a time
  await page.evaluate(
    ([href, n]: [string, number]) => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.innerHTML = `<img id="icon" src="${href}" width="${n}" height="${n}" style="display:block;position:fixed;left:0;top:0">`;
      const img = document.getElementById('icon');
      return new Promise<void>((resolve) => img?.addEventListener('load', () => resolve()));
    },
    [pathToFileURL(join(DIR, src)).href, size] as [string, number],
  );
  // oxlint-disable-next-line no-await-in-loop -- one page, one image at a time
  await page.locator('#icon').screenshot({ path: join(DIR, name), omitBackground: true });
}

await page.goto(pathToFileURL(join(DIR, 'social/cards.html')).href);
await page.evaluate(async () => {
  await document.fonts.ready;
});
const cards: [string, string][] = [
  ['og', 'og-1200x630.png'],
  ['gh', 'github-1280x640.png'],
  ['x', 'x-header-1500x500.png'],
  ['av', 'avatar-400.png'],
];
for (const [id, name] of cards) {
  // oxlint-disable-next-line no-await-in-loop -- screenshots of one page, in turn
  await page.locator(`#${id}`).screenshot({ path: join(DIR, 'social', name) });
}
await browser.close();
console.log('rendered');
