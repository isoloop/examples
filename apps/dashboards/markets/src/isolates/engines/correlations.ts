import { defineIsolate } from '@isoloop/runtime';
import { runCorrelations } from '../../core/engines';
import { busSource } from '../../isoloop/source';

// Headless engine (M3c task 4): correlations across symbols into correlations.v1.
export default defineIsolate({
  start(ctx) {
    runCorrelations(busSource(ctx.bus));
  },
});
