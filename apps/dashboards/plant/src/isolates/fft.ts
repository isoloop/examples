import { defineIsolate } from '@isoloop/runtime';
import { runFft } from '../core/engines';
import { busSource } from '../isoloop/source';
import { jobConfig } from './config';

// Headless: a machine's fft engine (M3d task 3).
export default defineIsolate({
  start(ctx) {
    const c = jobConfig(ctx.config);
    const job = runFft(busSource(ctx.bus), c.machine, c.rateKHz);
    ctx.onShutdown(() => {
      job.stop();
    });
  },
});
