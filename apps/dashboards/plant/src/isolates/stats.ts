import { defineIsolate } from '@isoloop/runtime';
import { runStats } from '../core/engines';
import { busSource } from '../isoloop/source';
import { jobConfig } from './config';

// Headless: a machine's stats engine (M3d task 3).
export default defineIsolate({
  start(ctx) {
    const c = jobConfig(ctx.config);
    const job = runStats(busSource(ctx.bus), c.machine);
    ctx.onShutdown(() => {
      job.stop();
    });
  },
});
