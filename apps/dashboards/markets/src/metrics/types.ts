import type { Timing } from '../core/schemas';

/** What the build-specific source adds to the panel (M3b task 17). */
export type BuildMetrics = {
  /** Worst loop lag across worker isolates, ms; `null` where there are no workers. */
  workerLagMs: number | null;
  /** Records per second across the bus; `null` where there is no bus. */
  busRecordsPerSec: number | null;
};

export interface BuildMetricsSource {
  read(): BuildMetrics;
  /** Calls `fn` with each widget's and engine's time per second (M3c task 10). */
  timings(fn: (t: Timing) => void): () => void;
  /**
   * Main-thread milliseconds spent applying each surface's DOM changes since
   * the page loaded, by slot; `null` where widgets render on the main thread.
   */
  applyMs(): ReadonlyMap<string, number> | null;
  /** Each isolate's state by id; `null` where nothing runs in isolates. */
  states(): Record<string, string> | null;
}
