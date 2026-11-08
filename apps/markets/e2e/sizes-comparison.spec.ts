import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  expect,
  test,
  type Browser,
  type CDPSession,
  type Locator,
  type Page,
} from '@playwright/test';

// The comparison matrix (M3c task 12): each size on each build, at the
// replay's own rate, one page at a time in Chromium. `scripts/compare.ts`
// turns the results into tables. What each figure covers:
//
// - Main-thread CPU, layouts/s, style recalcs/s: the page's main thread only,
//   from CDP `Performance.getMetrics` (TaskDuration, LayoutCount,
//   RecalcStyleCount) over a 10 s window with no input. Work in workers is not
//   in these.
// - Renderer CPU: all of the renderer processes' threads (main thread and
//   every worker), from `SystemInfo.getProcessInfo` cpuTime over the same
//   window, as % of one core. GPU CPU: the GPU process, same way.
// - Renderer memory: PSS of the renderer processes (Linux, smaps_rollup),
//   which covers workers too, at the end of the window.
// - Frames: gaps between the ticker tape's animation frames over the window;
//   "over 25 ms" counts frames that came late.
// - Typing: median of 5 keystrokes into the alerts panel, after the window.
// - Per category: work ms/s (on each widget's own thread on Isoloop, on the
//   main thread on native), DOM apply ms/s (Isoloop's main thread), updates/s.
//
// CPU throttling is not used: CDP throttling slows the page's main thread but
// not its workers (comparison/README.md), so it would not be a like-for-like
// slowdown.
const OUT = 'comparison-results/sizes';
const SIZES = ['lite', 'normal', 'heavy'] as const;
const BUILDS = ['native', 'isoloop', 'native-preact', 'isoloop-preact'] as const;
const WARM_MS = 6_000;
const WINDOW_MS = 10_000;
const SAMPLES = 5;
const LATE_FRAME_MS = 25;

const median = (xs: number[]): number =>
  xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const quantile = (xs: number[], q: number): number =>
  xs.toSorted((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * q))] ?? 0;

type PageMetrics = Record<string, number>;
async function pageMetrics(cdp: CDPSession): Promise<PageMetrics> {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}

type Proc = { type: string; id: number; cpuTime: number };
async function processes(browser: Browser): Promise<Proc[]> {
  const cdp = await browser.newBrowserCDPSession();
  try {
    const { processInfo }: { processInfo: Proc[] } = await cdp.send('SystemInfo.getProcessInfo');
    return processInfo;
  } finally {
    await cdp.detach();
  }
}
const cpuOf = (ps: Proc[], type: string): Map<number, number> =>
  new Map(ps.filter((p) => p.type === type).map((p) => [p.id, p.cpuTime]));
/** CPU seconds spent by processes of a type between two snapshots (processes present in both). */
function cpuDelta(before: Proc[], after: Proc[], type: string): number {
  const b = cpuOf(before, type);
  let s = 0;
  for (const [id, t] of cpuOf(after, type)) s += t - (b.get(id) ?? t);
  return s;
}
/** PSS in MB of the given pids, or null where /proc isn't there (not Linux). */
function pssMb(pids: number[]): number | null {
  let kb = 0;
  for (const pid of pids) {
    const f = `/proc/${pid}/smaps_rollup`;
    if (!existsSync(f)) return null;
    const m = /^Pss:\s+(\d+) kB/m.exec(readFileSync(f, 'utf8'));
    kb += Number(m?.[1] ?? 0);
  }
  return Math.round(kb / 1024);
}

function alerts(page: Page): { input: Locator; add: Locator } {
  const panel = page.locator('[data-slot="alerts-panel"]');
  return {
    input: panel.getByLabel('Threshold'),
    add: panel.getByRole('button', { name: 'Add rule' }),
  };
}
async function latency(page: Page, text: string): Promise<number> {
  const { input, add } = alerts(page);
  await input.fill('');
  await expect(add).toBeDisabled({ timeout: 30_000 });
  const t0 = Date.now();
  await input.fill(text);
  await expect(add).toBeEnabled({ timeout: 30_000 });
  return Date.now() - t0;
}
const metric = async (page: Page, key: string): Promise<string> =>
  (await page.locator(`[data-metric="${key}"] dd`).textContent()) ?? '';

const VIEWPORT = { width: 960, height: 600 };

for (const size of SIZES) {
  for (const build of BUILDS) {
    // The React pair at Normal is recorded as the video.
    const recorded = size === 'normal' && (build === 'native' || build === 'isoloop');
    test(`sizes: ${build} at ${size}`, async ({ browser, baseURL }, info) => {
      test.setTimeout(180_000);
      // Its own context, so only the recorded runs pay for recording.
      const context = await browser.newContext({
        ...(baseURL === undefined ? {} : { baseURL }),
        viewport: VIEWPORT,
        ...(recorded ? { recordVideo: { dir: info.outputPath('video'), size: VIEWPORT } } : {}),
      });
      const page = await context.newPage();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
      await page.goto(`/${build}/?size=${size}&speed=1&seed=7`);
      await expect(page.locator('[data-metric="first-data"] dd')).toHaveText(/ms$/, {
        timeout: 30_000,
      });
      await page.waitForTimeout(WARM_MS);

      const m0 = await pageMetrics(cdp);
      const p0 = await processes(browser);
      const frames0 = await page.evaluate(() => window.tape.frames);
      await page.waitForTimeout(WINDOW_MS);
      const m1 = await pageMetrics(cdp);
      const p1 = await processes(browser);
      const tape = await page.evaluate(() => ({
        frames: window.tape.frames,
        gaps: window.tape.gaps,
      }));
      const categories = await page.evaluate(() => window.categories());

      const seconds = (m1['Timestamp'] ?? 0) - (m0['Timestamp'] ?? 0) || WINDOW_MS / 1000;
      const delta = (k: string): number => (m1[k] ?? 0) - (m0[k] ?? 0);
      const gaps = tape.gaps.slice(-(tape.frames - frames0));
      const renderers = [...cpuOf(p1, 'renderer').keys()];

      await latency(page, '0'); // warm up
      const typing: number[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        // oxlint-disable-next-line no-await-in-loop
        typing.push(await latency(page, String(i + 1)));
      }

      const result = {
        size,
        build,
        windowSeconds: Math.round(seconds * 10) / 10,
        mainThreadCpuPct: Math.round((delta('TaskDuration') / seconds) * 1000) / 10,
        layoutsPerSec: Math.round((delta('LayoutCount') / seconds) * 10) / 10,
        styleRecalcsPerSec: Math.round((delta('RecalcStyleCount') / seconds) * 10) / 10,
        rendererCpuPct: Math.round((cpuDelta(p0, p1, 'renderer') / seconds) * 1000) / 10,
        gpuCpuPct: Math.round((cpuDelta(p0, p1, 'GPU') / seconds) * 1000) / 10,
        rendererPssMb: pssMb(renderers),
        frames: gaps.length,
        frameP95Ms: Math.round(quantile(gaps, 0.95) * 10) / 10,
        framesOver25Ms: gaps.filter((g) => g > LATE_FRAME_MS).length,
        typingMedianMs: median(typing),
        typing,
        categories,
        firstData: await metric(page, 'first-data'),
        bundle: await metric(page, 'bundle'),
        longTasks: await metric(page, 'long-tasks'),
      };
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${size}-${build}.json`, `${JSON.stringify(result, null, 2)}\n`);
      await cdp.detach();
      const video = page.video();
      await context.close();
      if (video) copyFileSync(await video.path(), `${OUT}/${size}-${build}.webm`);
    });
  }
}
