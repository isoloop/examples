import { defineIsolate } from '@isoloop/runtime';
import { runStats } from '../../core/engines';
import { busSource } from '../../isoloop/source';

// Headless engine (M3c task 3): rolling stats per symbol into stats.v1.
export default defineIsolate({
  start(ctx) {
    runStats(busSource(ctx.bus));
  },
});
