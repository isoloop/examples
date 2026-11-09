import { defineIsolate } from '@isoloop/runtime';
import { runFleet } from '../core/engines';
import { busSource } from '../isoloop/source';

// Headless: the fleet engine (M3d task 3), from the machines' health only.
export default defineIsolate({
  start(ctx) {
    const job = runFleet(busSource(ctx.bus));
    ctx.onShutdown(() => {
      job.stop();
    });
  },
});
