import { expect, test, type Page } from '@playwright/test';

// DIAG (not merged): where the main thread's time goes, per variant.
// Typing latency is measured as budget.spec.ts does (alerts panel: fill, until
// "Add rule" is enabled). Main-thread probes, installed before the page loads:
//  - lag: a 5 ms setTimeout probe; the sum of its lateness is time the main
//    thread was busy with anything (JS, style, layout, paint, canvas commits).
//  - raf: time spent inside requestAnimationFrame callbacks (on Isoloop the
//    compositor applies DOM batches there; on native, canvas draws run there).
//  - msg: time spent in 'message' listeners on Worker/MessagePort objects.
//  - frames: rAF callbacks per second, and gaps over 50 ms.

const RUNS = Number(process.env['DIAG_RUNS'] ?? '3');
const SAMPLES = 7;
const WINDOW_MS = 8_000;
const HEAVY_CANVAS = [
  'price', 'spread', 'volume', 'sparklines', 'vwap', 'volatility', 'volume-profile',
  'correlations', 'depth', 'correlations-5m', 'correlations-15m', 'depth-ETH-USD',
  'depth-SOL-USD', 'depth-XRP-USD', 'depth-DOGE-USD', 'spreads', 'order-flow',
];
const HEAVY_DOM = ['filters', 'trades', 'alerts-panel', 'top-movers', 'arbitrage', 'tape', 'summary'];

interface Variant {
  name: string;
  build: string;
  size: string;
  query?: string;
  noDom?: boolean;
}

const VARIANTS: Variant[] = [
  { name: 'a as is', build: 'isoloop', size: 'heavy' },
  { name: 'b canvas off', build: 'isoloop', size: 'heavy', query: `widgets=${HEAVY_DOM.join(',')}` },
  { name: 'c DOM off', build: 'isoloop', size: 'heavy', query: `widgets=alerts-panel,${HEAVY_CANVAS.join(',')}` },
  { name: 'd not presented', build: 'isoloop', size: 'heavy', query: 'diag=nopresent' },
  { name: 'e messages only', build: 'isoloop', size: 'heavy', query: 'diag=nopresent', noDom: true },
  { name: 'a as is', build: 'isoloop', size: 'normal' },
  { name: 'a as is', build: 'native', size: 'heavy' },
  { name: 'b canvas off', build: 'native', size: 'heavy', query: `widgets=${HEAVY_DOM.join(',')}` },
  { name: 'c DOM off', build: 'native', size: 'heavy', query: `widgets=alerts-panel,${HEAVY_CANVAS.join(',')}` },
  { name: 'a as is', build: 'native', size: 'normal' },
];

const median = (xs: number[]): number => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

const PROBE = (noDom: boolean): void => {
  const w = window as unknown as Record<string, unknown>;
  if (noDom) w['__diagNoDom'] = true;
  const acc = { delays: [] as number[], raf: 0, msg: 0, frames: 0, long: 0, last: 0 };
  w['__diag'] = acc;
  // Probe: every 25 ms post a message to ourselves; its delivery delay is how
  // long a new task waits behind whatever the main thread is doing.
  const ch = new MessageChannel();
  let sent = 0;
  ch.port1.onmessage = (): void => {
    acc.delays.push(performance.now() - sent);
    setTimeout(() => {
      sent = performance.now();
      ch.port2.postMessage(0);
    }, 25);
  };
  sent = performance.now();
  ch.port2.postMessage(0);
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    raf((t) => {
      const t0 = performance.now();
      try {
        cb(t);
      } finally {
        acc.raf += performance.now() - t0;
      }
    });
  const frame = (t: number): void => {
    if (acc.last) {
      acc.frames++;
      if (t - acc.last > 50) acc.long++;
    }
    acc.last = t;
    raf(frame);
  };
  raf(frame);
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, l: unknown, o?: unknown) {
    if (type === 'message' && typeof l === 'function' && (this instanceof Worker || this instanceof MessagePort)) {
      const fn = l as (e: Event) => void;
      const wrapped = function (this: unknown, e: Event): void {
        const t0 = performance.now();
        try {
          fn.call(this, e);
        } finally {
          acc.msg += performance.now() - t0;
        }
      };
      return add.call(this, type, wrapped, o as boolean);
    }
    return add.call(this, type, l as EventListener, o as boolean);
  };
};

async function latency(page: Page, text: string): Promise<number> {
  const panel = page.locator('[data-slot="alerts-panel"]');
  const input = panel.getByLabel('Threshold');
  const add = panel.getByRole('button', { name: 'Add rule' });
  await input.fill('');
  await expect(add).toBeDisabled({ timeout: 30_000 });
  const t0 = Date.now();
  await input.fill(text);
  await expect(add).toBeEnabled({ timeout: 30_000 });
  return Date.now() - t0;
}

type Snap = { n: number; raf: number; msg: number; frames: number; long: number };
const snap = (page: Page): Promise<Snap> =>
  page.evaluate(() => {
    const d = (window as unknown as { __diag: Snap & { delays: number[] } }).__diag;
    return { n: d.delays.length, raf: d.raf, msg: d.msg, frames: d.frames, long: d.long };
  });

for (const v of VARIANTS) {
  for (let run = 1; run <= RUNS; run++) {
    test(`${v.build} ${v.size} ${v.name} #${run}`, async ({ page, browserName }) => {
      test.setTimeout(180_000);
      await page.addInitScript(PROBE, !!v.noDom);
      await page.goto(`/${v.build}/?size=${v.size}&speed=1&seed=7${v.query ? `&${v.query}` : ''}`);
      // Ready when the alerts panel can be typed into (the trades table is
      // absent in some variants), then 10 s for the engines to fill.
      await expect(
        page.locator('[data-slot="alerts-panel"]').getByLabel('Threshold'),
      ).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(10_000);
      const s0 = await snap(page);
      const t0 = Date.now();
      await page.waitForTimeout(WINDOW_MS);
      const s1 = await snap(page);
      const secs = (Date.now() - t0) / 1000;
      const delays = await page.evaluate(
        ([a, b]) => (window as unknown as { __diag: { delays: number[] } }).__diag.delays.slice(a, b),
        [s0.n, s1.n] as const,
      );
      const sorted = delays.toSorted((x, y) => x - y);
      const pct = (q: number): number => +(sorted[Math.floor((sorted.length - 1) * q)] ?? 0).toFixed(1);
      await latency(page, '0');
      const xs: number[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        // oxlint-disable-next-line no-await-in-loop
        xs.push(await latency(page, String(i + 1)));
      }
      const row = {
        engine: browserName,
        build: v.build,
        size: v.size,
        variant: v.name,
        run,
        inputMs: median(xs),
        probeP50: pct(0.5),
        probeP95: pct(0.95),
        probeN: delays.length,
        rafMsPerS: +((s1.raf - s0.raf) / secs).toFixed(1),
        msgMsPerS: +((s1.msg - s0.msg) / secs).toFixed(1),
        fps: +((s1.frames - s0.frames) / secs).toFixed(1),
        longFrames: s1.long - s0.long,
      };
      console.log(`[diag] ${JSON.stringify(row)}`);
    });
  }
}
