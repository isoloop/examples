// Native has no workers and no bus: those figures are "n/a".
import type { BuildMetricsSource } from './types';

export const buildMetrics: BuildMetricsSource = {
  read: () => ({ workerLagMs: null, busRecordsPerSec: null }),
};
