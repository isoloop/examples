import { defineIsolate } from '@isoloop/runtime';
import { runDepth } from '../../core/engines';
import { busSource } from '../../isoloop/source';

// Headless engine (M3c task 5): consolidated book depth per symbol into depth.v1.
export default defineIsolate({
  start(ctx) {
    runDepth(busSource(ctx.bus));
  },
});
