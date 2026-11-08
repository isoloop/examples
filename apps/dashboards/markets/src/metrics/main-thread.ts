// What the panel measures on the main thread, the same in every build
// (M3b task 17): frame rate, long tasks, input latency, memory and time to
// first data. Each engine supports a different set of performance APIs, so
// the ones every engine has are measured directly: long tasks also come from
// timer drift where `longtask` entries don't exist, and input latency is the
// time from an input event to the frame after it.

export type MainThreadMetrics = {
  fps: number;
  /** Tasks over 50 ms in the last 10 s. */
  longTasks: number;
  /** Worst input-to-next-frame latency in the last 10 s, ms; `null` before any input. */
  inputLatencyMs: number | null;
  /** Median input-to-next-frame latency in the last 10 s, ms; `null` before any input. */
  inputMedianMs: number | null;
  /** Bytes, or why it can't be measured. */
  memory: number | 'unavailable' | 'pending';
  /** From navigation to the first trade on screen, ms; `null` until then. */
  firstDataMs: number | null;
};

const WINDOW_MS = 10_000;
const recent = (xs: { at: number }[]): void => {
  const cut = performance.now() - WINDOW_MS;
  while (xs.length > 0 && (xs[0]?.at ?? 0) < cut) xs.shift();
};

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = xs.toSorted((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

let shared: (() => MainThreadMetrics) | undefined;

/** The page's one set of main-thread measurements, shared by the panel and the badge. */
export function mainThreadMetrics(): () => MainThreadMetrics {
  shared ??= startMainThreadMetrics();
  return shared;
}

export function startMainThreadMetrics(): () => MainThreadMetrics {
  // Frame rate: frames in the last second.
  const frames: number[] = [];
  const frame = (t: number): void => {
    frames.push(t);
    while (frames.length > 0 && (frames[0] ?? 0) < t - 1_000) frames.shift();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Long tasks: `longtask` entries where the engine has them, else timer drift.
  const long: { at: number }[] = [];
  if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) long.push({ at: e.startTime });
    }).observe({ type: 'longtask', buffered: true });
  } else {
    let last = performance.now();
    setInterval(() => {
      const now = performance.now();
      if (now - last - 50 > 50) long.push({ at: now });
      last = now;
    }, 50);
  }

  // Input latency: from the event to the frame after it.
  const inputs: { at: number; ms: number }[] = [];
  const onInput = (e: Event): void => {
    const t0 = e.timeStamp;
    requestAnimationFrame(() => {
      setTimeout(() => inputs.push({ at: performance.now(), ms: performance.now() - t0 }), 0);
    });
  };
  for (const type of ['pointerdown', 'keydown', 'input']) {
    addEventListener(type, onInput, { capture: true, passive: true });
  }

  // Memory: needs cross-origin isolation (COOP/COEP), and only Chromium has it.
  let memory: MainThreadMetrics['memory'] = 'pending';
  const perf = performance as Performance & {
    measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
  };
  const measure = perf.measureUserAgentSpecificMemory?.bind(perf);
  if (!crossOriginIsolated || !measure) memory = 'unavailable';
  else {
    const sample = (): void => {
      void measure().then((m) => {
        memory = m.bytes;
      });
    };
    sample();
    setInterval(sample, 10_000);
  }

  // Time to first data: the first trade row, inside a surface's shadow root or not.
  let firstDataMs: number | null = null;
  const hasTrade = (root: ParentNode): boolean => {
    if (root.querySelector('.trade')) return true;
    for (const el of root.querySelectorAll('[data-slot]')) {
      const shadow = el.firstElementChild?.shadowRoot ?? el.shadowRoot;
      if (shadow && hasTrade(shadow)) return true;
      for (const child of el.querySelectorAll('*')) {
        if (child.shadowRoot && hasTrade(child.shadowRoot)) return true;
      }
    }
    return false;
  };
  const poll = setInterval(() => {
    if (hasTrade(document)) {
      firstDataMs = performance.now();
      clearInterval(poll);
    }
  }, 25);

  return () => {
    recent(long);
    recent(inputs);
    return {
      fps: frames.length,
      longTasks: long.length,
      inputLatencyMs: inputs.length > 0 ? Math.max(...inputs.map((i) => i.ms)) : null,
      inputMedianMs: median(inputs.map((i) => i.ms)),
      memory,
      firstDataMs,
    };
  };
}
