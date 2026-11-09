import { defineIsolate } from '@isoloop/runtime';
import { runHealth } from '../core/engines';
import { busSource } from '../isoloop/source';
import { jobConfig } from './config';

// Headless: a machine's health engine (M3d task 3).
export default defineIsolate({
  start(ctx) {
    const c = jobConfig(ctx.config);
    const job = runHealth(busSource(ctx.bus), c.machine);
    ctx.onShutdown(() => {
      job.stop();
    });
  },
});
