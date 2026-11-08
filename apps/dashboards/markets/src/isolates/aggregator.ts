import { defineIsolate } from '@isoloop/runtime';
import { runAggregator } from '../core/services';
import { busSource } from '../isoloop/source';

// Headless: cross-market VWAP, spread and volume into aggregates.v1.
export default defineIsolate({
  start(ctx) {
    runAggregator(busSource(ctx.bus));
  },
});
