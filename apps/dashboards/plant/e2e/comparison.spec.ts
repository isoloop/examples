import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  _android,
  expect,
  test,
  type AndroidDevice,
  type Browser,
  type BrowserContext,
  type CDPSession,
  type Page,
} from '@playwright/test';

// The recorded comparison (M3d task 11): the two native builds and each
// Isoloop placement, at each rate, one page at a time, on the engine of the
// project that runs it (comparison, comparison-firefox, comparison-webkit).
// `scripts/compare.ts` turns the results into tables. What each figure covers:
//
// - Frames: gaps between the ticker tape's animation frames over a 10 s
//   window with no input; "late" are those over 25 ms. Long tasks from the
//   metrics panel over the same 10 s.
// - Typing: median of 5 keystrokes into T1's event-log filter, a widget, from
//   the keystroke until the widget has rendered the text.
// - Main-thread CPU (CDP `Performance.getMetrics` TaskDuration), renderer CPU
//   across all threads and GPU CPU (`SystemInfo.getProcessInfo`), renderer
//   memory (PSS, Linux): Chromium only, as % of one core and MB. Memory is
//   also read after a forced GC in the page and every worker (CDP
//   HeapProfiler.collectGarbage, twice), so garbage timing doesn't decide it.
// - Hold (`COMPARE_HOLD_MS`, e.g. 600000): after typing, the page keeps
//   running until that long after navigation, then memory is read again, with
//   and without a GC, before the fault.
// - Runs (`COMPARE_RUNS`, default 1): every configuration that many times,
//   one page at a time, interleaved: round 1 runs each configuration once,
//   then round 2, and so on (A, B, A, B), so drift on the machine falls on
//   both sides of a pair. Result files get a `-run<k>` suffix when it's over 1.
// - Durations: `COMPARE_WARM_MS` (default 6000) and `COMPARE_WINDOW_MS`
//   (default 10000). `comparison/run.ts` sets all of these from its arguments.
// - Workers: as the metrics panel counts them (pools once).
// - Start-up: from navigation to the first gauges on screen (first data), and
//   to every one of the 72 widgets showing data.
// - Per category: work ms/s, DOM apply ms/s (Isoloop), updates/s.
// - Fault: T3's gauges block their loop for 3 s. Recovery: from the click
//   until T3's gauges, sensor table and temperature trend all show data from
//   after it. Data gap: the longest stretch with no spectrum record on a
//   machine's derived topic beyond its normal interval, for T3 and for the
//   worst other machine.
//
// CPU throttling is not used: CDP throttling slows the main thread but not
// workers (engine constraint 8), so it would not be a like-for-like slowdown.
// Run the whole thing on fewer cores instead (`taskset`), as README.md says.
const OUT = process.env['COMPARE_OUT'] ?? 'comparison-results';
const RATES = (process.env['COMPARE_RATES'] ?? '1,2,5').split(',').map(Number);
const ALL = [
  'native',
  'native-workers',
  'isoloop:split',
  'isoloop:machine',
  'isoloop:shared-engines',
  'isoloop:own',
  'isoloop:matched',
  'isoloop:one',
];
const CONFIGS = process.env['COMPARE_CONFIGS']?.split(',') ?? ALL;
const RUNS = Number(process.env['COMPARE_RUNS'] ?? 1);
const HOLD_MS = Number(process.env['COMPARE_HOLD_MS'] ?? 0);
const WARM_MS = Number(process.env['COMPARE_WARM_MS'] ?? 6_000);
const WINDOW_MS = Number(process.env['COMPARE_WINDOW_MS'] ?? 10_000);
const SAMPLES = 5;
const LATE_FRAME_MS = 25;
const VIEWPORT = { width: 1400, height: 900 };

declare global {
  interface Window {
    /** Each machine's spectrum times since the fault was set up. */
    spectra: Record<string, number[]>;
  }
}

const median = (xs: number[]): number =>
  xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const quantile = (xs: number[], q: number): number =>
  xs.toSorted((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * q))] ?? 0;
const r1 = (x: number): number => Math.round(x * 10) / 10;

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
function cpuDelta(before: Proc[], after: Proc[], type: string): number {
  const b = cpuOf(before, type);
  let s = 0;
  for (const [id, t] of cpuOf(after, type)) s += t - (b.get(id) ?? t);
  return s;
}
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

/**
 * Forces a GC in the page and in every worker, twice (a worker's first
 * collection can leave garbage the second frees), over non-flattened target
 * sessions, as the plant memory investigation's probes do.
 */
async function gcAll(browser: Browser): Promise<void> {
  const b = await browser.newBrowserCDPSession();
  const pending = new Map<number, () => void>();
  let next = 1;
  b.on('Target.receivedMessageFromTarget', (e: { message: string }) => {
    const m: unknown = JSON.parse(e.message);
    const id: unknown = typeof m === 'object' && m !== null ? Reflect.get(m, 'id') : undefined;
    if (typeof id !== 'number') return;
    pending.get(id)?.();
    pending.delete(id);
  });
  try {
    for (let round = 0; round < 2; round++) {
      // oxlint-disable-next-line no-await-in-loop -- rounds in order
      const { targetInfos } = (await b.send('Target.getTargets')) as {
        targetInfos: { targetId: string; type: string }[];
      };
      for (const t of targetInfos.filter((x) => x.type === 'worker' || x.type === 'page')) {
        // oxlint-disable-next-line no-await-in-loop -- one target at a time
        const { sessionId } = await b.send('Target.attachToTarget', {
          targetId: t.targetId,
          flatten: false,
        });
        const id = next++;
        const done = new Promise<void>((resolve) => pending.set(id, resolve));
        // oxlint-disable-next-line no-await-in-loop -- one target at a time
        await b.send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id, method: 'HeapProfiler.collectGarbage', params: {} }),
        });
        // oxlint-disable-next-line no-await-in-loop -- one target at a time
        await Promise.race([done, new Promise((r) => setTimeout(r, 5_000))]);
        // oxlint-disable-next-line no-await-in-loop -- one target at a time
        await b.send('Target.detachFromTarget', { sessionId }).catch(() => {});
      }
    }
  } finally {
    await b.detach();
  }
}

/** Renderer PSS now and after a forced GC, MB (Chromium on Linux). */
async function memory(browser: Browser): Promise<{ pss: number | null; pssGc: number | null }> {
  const pids = (): Promise<number[]> =>
    processes(browser).then((ps) => [...cpuOf(ps, 'renderer').keys()]);
  const pss = pssMb(await pids());
  await gcAll(browser);
  await new Promise((r) => setTimeout(r, 1_000));
  return { pss, pssGc: pssMb(await pids()) };
}

// Android (`COMPARE_ANDROID=<adb serial>`): Chrome on a phone through
// Playwright's `_android`, against the deployed pages (`LIVE_URL`). There's no
// browser-level CDP there, so process CPU comes from /proc/<pid>/stat and
// memory from `dumpsys meminfo` (PSS) over adb, and the forced GC goes
// through the page's own session, attaching to its workers. Chrome's
// renderers are its `sandboxed_process` processes and its GPU process is
// `privileged_process`.
const ANDROID = process.env['COMPARE_ANDROID'];
let device: AndroidDevice | undefined;
async function androidDevice(): Promise<AndroidDevice> {
  if (device) return device;
  const all = await _android.devices();
  device = all.find((d) => d.serial() === ANDROID);
  if (!device) throw new Error(`no adb device ${ANDROID}`);
  return device;
}
const shell = async (d: AndroidDevice, cmd: string): Promise<string> =>
  (await d.shell(cmd)).toString();
async function androidProcesses(d: AndroidDevice): Promise<Proc[]> {
  const ps = await shell(d, 'ps -A -o PID,NAME');
  const procs: Proc[] = [];
  for (const line of ps.split('\n')) {
    const [pid, name = ''] = line.trim().split(/\s+/);
    if (!name.startsWith('com.android.chrome')) continue;
    const type = name.includes(':sandboxed_process')
      ? 'renderer'
      : name.includes(':privileged_process')
        ? 'GPU'
        : 'browser';
    // oxlint-disable-next-line no-await-in-loop -- a handful of processes
    const stat = await shell(d, `cat /proc/${pid}/stat 2>/dev/null`);
    // After the command name: utime and stime are the 12th and 13th fields, in ticks of 1/100 s.
    const f = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    const ticks = Number(f[11] ?? 0) + Number(f[12] ?? 0);
    procs.push({ type, id: Number(pid), cpuTime: ticks / 100 });
  }
  return procs;
}
async function androidPssMb(d: AndroidDevice, pids: number[]): Promise<number | null> {
  if (pids.length === 0) return null;
  let kb = 0;
  for (const pid of pids) {
    // oxlint-disable-next-line no-await-in-loop -- one process at a time
    const m = /TOTAL PSS:\s+(\d+)/.exec(await shell(d, `dumpsys meminfo ${pid}`));
    if (!m) return null;
    kb += Number(m[1]);
  }
  return Math.round(kb / 1024);
}
/** A forced GC in the page and its workers, twice, through the page's own session. */
async function gcPage(cdp: CDPSession): Promise<void> {
  const sessions = new Set<string>();
  const onAttach = (e: { sessionId: string; targetInfo: { type: string } }): void => {
    if (e.targetInfo.type === 'worker') sessions.add(e.sessionId);
  };
  cdp.on('Target.attachedToTarget', onAttach);
  await cdp.send('Target.setAutoAttach', {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: false,
  });
  await new Promise((r) => setTimeout(r, 500));
  for (let round = 0; round < 2; round++) {
    // oxlint-disable-next-line no-await-in-loop -- rounds in order
    await cdp.send('HeapProfiler.collectGarbage');
    for (const sessionId of sessions) {
      // oxlint-disable-next-line no-await-in-loop -- one worker at a time
      await cdp
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id: 1, method: 'HeapProfiler.collectGarbage', params: {} }),
        })
        .catch(() => {});
    }
    // oxlint-disable-next-line no-await-in-loop -- let the workers finish
    await new Promise((r) => setTimeout(r, 1_000));
  }
  cdp.off('Target.attachedToTarget', onAttach);
}

/** Where a run happens: a desktop browser from Playwright, or Chrome on an Android device. */
type Target = {
  engine: string;
  newContext: () => Promise<BrowserContext>;
  /** The URL to open for a path (Android contexts have no baseURL). */
  url: (path: string) => string;
  procs: (() => Promise<Proc[]>) | null;
  pss: (renderers: number[]) => Promise<number | null>;
  memory: (cdp: CDPSession | null) => Promise<{ pss: number | null; pssGc: number | null }>;
};
function desktopTarget(browser: Browser, engine: string, baseURL: string | undefined): Target {
  const chromium = engine === 'chromium';
  return {
    engine,
    newContext: () =>
      browser.newContext({ ...(baseURL === undefined ? {} : { baseURL }), viewport: VIEWPORT }),
    url: (path) => path,
    procs: chromium ? () => processes(browser) : null,
    pss: (pids) => Promise.resolve(chromium ? pssMb(pids) : null),
    memory: () => (chromium ? memory(browser) : Promise.resolve({ pss: null, pssGc: null })),
  };
}
async function androidTarget(baseURL: string | undefined): Promise<Target> {
  const d = await androidDevice();
  const renderers = async (): Promise<number[]> =>
    (await androidProcesses(d)).filter((p) => p.type === 'renderer').map((p) => p.id);
  return {
    engine: 'android-chrome',
    newContext: () => d.launchBrowser(),
    url: (path) => new URL(path.replace(/^\//, ''), `${baseURL ?? ''}/`).toString(),
    procs: () => androidProcesses(d),
    pss: (pids) => androidPssMb(d, pids),
    memory: async (cdp) => {
      const pss = await androidPssMb(d, await renderers());
      if (cdp) await gcPage(cdp);
      await new Promise((r) => setTimeout(r, 1_000));
      return { pss, pssGc: await androidPssMb(d, await renderers()) };
    },
  };
}

const filter = (page: Page) => page.locator('[data-slot="T1-events"] input[name="event-text"]');
const rendered = (page: Page) => page.locator('[data-slot="T1-events"] .events');
async function latency(page: Page, text: string): Promise<number> {
  await filter(page).fill('');
  await expect(rendered(page)).toHaveAttribute('data-filter', '', { timeout: 30_000 });
  const t0 = Date.now();
  await filter(page).fill(text);
  await expect(rendered(page)).toHaveAttribute('data-filter', text, { timeout: 30_000 });
  return Date.now() - t0;
}
const metric = async (page: Page, key: string): Promise<string> =>
  (await page.locator(`[data-metric="${key}"] dd`).textContent()) ?? '';

/** Starts recording each machine's spectrum times in the page, on whichever source the build has. */
async function recordSpectra(page: Page, isoloop: boolean): Promise<void> {
  await page.evaluate((iso) => {
    const seen: Record<string, number[]> = {};
    window.spectra = seen;
    for (const m of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] as const) {
      const ts: number[] = [];
      seen[m] = ts;
      const fn = (r: { value: unknown }): void => {
        const t: unknown =
          typeof r.value === 'object' && r.value !== null ? Reflect.get(r.value, 'ts') : null;
        if (typeof t === 'number') ts.push(t);
      };
      if (iso) {
        window.kernel.subscribe(
          { name: `plant.${m.toLowerCase()}.spectrum`, schema: { '~standard': {} } },
          fn,
        );
      } else window.store.subscribe(`${m}.spectrum`, fn, 'latest');
    }
  }, isoloop);
}

/** The longest gap in each machine's spectra after `from`, beyond the normal interval, in s. */
async function gaps(page: Page, from: number, normalMs: number): Promise<Record<string, number>> {
  const spectra = await page.evaluate(() => window.spectra);
  return Object.fromEntries(
    Object.entries(spectra).map(([m, ts]) => {
      const xs = ts.filter((t) => t >= from - 2 * normalMs).toSorted((a, b) => a - b);
      let worst = 0;
      for (let i = 1; i < xs.length; i++) worst = Math.max(worst, (xs[i] ?? 0) - (xs[i - 1] ?? 0));
      return [m, r1(Math.max(0, worst - normalMs) / 1000)];
    }),
  );
}

/** When T3's gauges, sensor table and trend all show data from after `since` (epoch ms). */
async function recovered(page: Page, since: number, timeoutMs: number): Promise<number | null> {
  const end = Date.now() + timeoutMs;
  const fresh = async (): Promise<boolean> => {
    const [g, s, t] = await Promise.all([
      page
        .locator('[data-slot="T3-gauges"] .gauges')
        .getAttribute('data-ts', { timeout: 1_000 })
        .catch(() => null),
      page
        .locator('[data-slot="T3-sensors"] .sensors')
        .getAttribute('data-ts', { timeout: 1_000 })
        .catch(() => null),
      page
        .locator('[data-slot="T3-temps"] canvas')
        .getAttribute('data-drawn', { timeout: 1_000 })
        .catch(() => null),
    ]);
    const at = Number(/at (\d+)$/.exec(t ?? '')?.[1] ?? 0);
    return Number(g) > since && Number(s) > since && at > since;
  };
  while (Date.now() < end) {
    // oxlint-disable-next-line no-await-in-loop -- polling
    if (await fresh()) return Date.now() - since;
    // oxlint-disable-next-line no-await-in-loop -- polling
    await page.waitForTimeout(50);
  }
  return null;
}

for (const rate of RATES) {
  for (let run = 1; run <= RUNS; run++) {
    for (const config of CONFIGS) {
      const [build = 'native', placement] = config.split(':');
      const name = `${placement ? `${build}-${placement}` : build}-${rate}khz${RUNS > 1 ? `-run${run}` : ''}`;
      const title = `compare: ${config} at ${rate} kHz${RUNS > 1 ? `, run ${run}` : ''}`;
      const body = async (target: Target): Promise<void> => {
        test.setTimeout(240_000 + HOLD_MS);
        const engine = target.engine;
        const dir = `${OUT}/${engine}`;
        mkdirSync(dir, { recursive: true });
        const write = (result: object): void => {
          writeFileSync(
            `${dir}/${name}.json`,
            `${JSON.stringify({ engine, build, placement: placement ?? null, rate, ...result }, null, 2)}\n`,
          );
        };
        const context = await target.newContext();
        const page = context.pages()[0] ?? (await context.newPage());
        const chromium = engine === 'chromium' || engine === 'android-chrome';
        const cdp = chromium ? await context.newCDPSession(page) : null;
        await cdp?.send('Performance.enable', { timeDomain: 'timeTicks' });
        const isoloop = build === 'isoloop';
        const url = `/${build}/?rate=${rate}&seed=7${placement ? `&placement=${placement}` : ''}`;
        try {
          const t0 = Date.now();
          await page.goto(target.url(url));
          await expect(page.locator('[data-metric="first-data"] dd')).toHaveText(/ms$/, {
            timeout: 30_000,
          });
          // Every widget showing data, polled from navigation.
          let allMs: number | null = null;
          while (Date.now() - t0 < 30_000) {
            // oxlint-disable-next-line no-await-in-loop -- polling
            if ((await page.evaluate(() => window.slotsWithData())) >= 72) {
              allMs = Date.now() - t0;
              break;
            }
            // oxlint-disable-next-line no-await-in-loop -- polling
            await page.waitForTimeout(100);
          }
          await page.waitForTimeout(WARM_MS);

          const m0 = cdp ? await pageMetrics(cdp) : {};
          const p0 = target.procs ? await target.procs() : [];
          const frames0 = await page.evaluate(() => window.tape.frames);
          await page.waitForTimeout(WINDOW_MS);
          const m1 = cdp ? await pageMetrics(cdp) : {};
          const p1 = target.procs ? await target.procs() : [];
          const tape = await page.evaluate(() => ({
            frames: window.tape.frames,
            gaps: window.tape.gaps,
          }));
          const longTasks = await metric(page, 'long-tasks');
          const memAtMs = Date.now() - t0;
          const mem = await target.memory(cdp);
          const categories = await page.evaluate(() => window.categories());
          const seconds = cdp
            ? (m1['Timestamp'] ?? 0) - (m0['Timestamp'] ?? 0) || WINDOW_MS / 1000
            : WINDOW_MS / 1000;
          const delta = (k: string): number => (m1[k] ?? 0) - (m0[k] ?? 0);
          const frameGaps = tape.gaps.slice(-(tape.frames - frames0));

          await latency(page, 'x');
          const typing: number[] = [];
          for (let i = 0; i < SAMPLES; i++) {
            // oxlint-disable-next-line no-await-in-loop
            typing.push(await latency(page, `x${i}`));
          }
          await filter(page).fill('');

          // The hold: memory once the page has run for HOLD_MS.
          let held: { pss: number | null; pssGc: number | null } | null = null;
          if (HOLD_MS > 0) {
            await page.waitForTimeout(Math.max(0, t0 + HOLD_MS - Date.now()));
            held = chromium ? await target.memory(cdp) : null;
          }

          // The fault: block T3's gauges for 3 s.
          await recordSpectra(page, isoloop);
          await page.waitForTimeout(2_000);
          await page.locator('[data-slot="T3-gauges"]').hover();
          const clicked = Date.now();
          await page.locator('[data-slot="T3-gauges"] button[name="stress-block"]').click();
          const recoveryMs = await recovered(page, clicked, 20_000);
          await page.waitForTimeout(2_000);
          const dataGaps = await gaps(page, clicked, 256 / rate);
          const others = Object.entries(dataGaps)
            .filter(([m]) => m !== 'T3')
            .map(([, g]) => g);

          write({
            stopped: false,
            url,
            workers: Number(await metric(page, 'workers')),
            firstDataMs: Number((await metric(page, 'first-data')).replace(/\D+/g, '')),
            allWidgetsMs: allMs,
            frames: frameGaps.length,
            fps: r1(frameGaps.length / (WINDOW_MS / 1000)),
            frameP95Ms: r1(quantile(frameGaps, 0.95)),
            framesLate: frameGaps.filter((g) => g > LATE_FRAME_MS).length,
            longTasks: Number(longTasks),
            typingMedianMs: median(typing),
            typing,
            mainThreadCpuPct: cdp ? r1((delta('TaskDuration') / seconds) * 100) : null,
            rendererCpuPct: chromium ? r1((cpuDelta(p0, p1, 'renderer') / seconds) * 100) : null,
            gpuCpuPct: chromium ? r1((cpuDelta(p0, p1, 'GPU') / seconds) * 100) : null,
            rendererPssMb: chromium ? await target.pss([...cpuOf(p1, 'renderer').keys()]) : null,
            rendererPssGcMb: mem.pssGc,
            memAtMs,
            holdMs: HOLD_MS || null,
            rendererPssHoldMb: held?.pss ?? null,
            rendererPssHoldGcMb: held?.pssGc ?? null,
            recoveryMs,
            dataGapT3S: dataGaps['T3'] ?? null,
            dataGapOthersS: others.length > 0 ? Math.max(...others) : null,
            categories,
            bundle: await metric(page, 'bundle'),
          });
        } catch (e) {
          // A page that stops (WebKit with worker canvases, engine constraint 2)
          // is a result too.
          write({
            stopped: true,
            url,
            error: (e instanceof Error ? (e.message.split('\n')[0] ?? '') : String(e)).replace(
              // oxlint-disable-next-line no-control-regex -- Playwright's terminal colours
              /\u001b\[[0-9;]*m/g,
              '',
            ),
          });
        } finally {
          await cdp?.detach().catch(() => {});
          await context.close();
        }
      };
      // An Android run never asks for the `browser` fixture, so no desktop
      // browser starts; the desktop run is unchanged.
      if (ANDROID) test(title, async ({ baseURL }) => body(await androidTarget(baseURL)));
      else {
        test(title, async ({ browser, baseURL, browserName }) =>
          body(desktopTarget(browser, browserName, baseURL)),
        );
      }
    }
  }
}
