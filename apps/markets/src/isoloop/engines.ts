// Each engine as a headless isolate: its module URL and the topics it may use (I4).
import correlations from '../isolates/engines/correlations?isolate';
import depth from '../isolates/engines/depth?isolate';
import stats from '../isolates/engines/stats?isolate';
import type { EngineName } from '../core/engines';
import type { Grants } from './grants';

export const ENGINE_ISOLATES: Record<EngineName, { src: string; grants: Grants }> = {
  stats: { src: stats, grants: { publish: ['stats.v1'], subscribe: ['trades.v1'] } },
  correlations: {
    src: correlations,
    grants: { publish: ['correlations.v1'], subscribe: ['trades.v1'] },
  },
  depth: { src: depth, grants: { publish: ['depth.v1'], subscribe: ['book.v1'] } },
};
