/** What the build-specific source adds to the panel (M3b task 17). */
export type BuildMetrics = {
  /** Worst loop lag across worker isolates, ms; `null` where there are no workers. */
  workerLagMs: number | null;
  /** Records per second across the bus; `null` where there is no bus. */
  busRecordsPerSec: number | null;
};

export interface BuildMetricsSource {
  read(): BuildMetrics;
  /** Each isolate's state by id; `null` where nothing runs in isolates. */
  states(): Record<string, string> | null;
}
