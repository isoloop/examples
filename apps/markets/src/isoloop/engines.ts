// Each engine as a headless isolate: its module URL and the topics it may use (I4).
import stats from '../isolates/engines/stats?isolate';
import type { EngineName } from '../core/engines';
import type { Grants } from './grants';

export const ENGINE_ISOLATES: Record<EngineName, { src: string; grants: Grants }> = {
  stats: { src: stats, grants: { publish: ['stats.v1'], subscribe: ['trades.v1'] } },
};
