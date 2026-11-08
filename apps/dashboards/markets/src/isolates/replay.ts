import { defineIsolate } from '@isoloop/runtime';
import { runReplay, type ReplayConfig } from '../core/services';
import { busSource } from '../isoloop/source';

const isConfig = (c: unknown): c is ReplayConfig => typeof c === 'object' && c !== null;

// Headless (ADR 0008): the replay source, in place of the live feeds.
export default defineIsolate({
  start(ctx) {
    runReplay(busSource(ctx.bus), isConfig(ctx.config) ? ctx.config : {});
  },
});
