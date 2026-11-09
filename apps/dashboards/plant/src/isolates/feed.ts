import { defineIsolate } from '@isoloop/runtime';
import { runFeed } from '../core/sensors/feed';
import { busSource } from '../isoloop/source';
import { jobConfig } from './config';

// Headless (ADR 0008): a machine's sensors (M3d task 2).
export default defineIsolate({
  start(ctx) {
    const feed = runFeed(busSource(ctx.bus), jobConfig(ctx.config));
    ctx.onShutdown(() => {
      feed.stop();
    });
  },
});
