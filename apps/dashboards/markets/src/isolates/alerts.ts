import { defineIsolate } from '@isoloop/runtime';
import { runAlerts } from '../core/services';
import { busSource } from '../isoloop/source';

// Headless: alert rules against prices and aggregates, into alerts.v1.
export default defineIsolate({
  start(ctx) {
    runAlerts(busSource(ctx.bus));
  },
});
