import { defineIsolate } from '@isoloop/runtime';
import { isMachine } from '../core/machines';
import { runFeed, type FeedConfig } from '../core/sensors/feed';
import { busSource } from '../isoloop/source';

function configOf(c: unknown): FeedConfig {
  const get = (k: string): unknown =>
    typeof c === 'object' && c !== null ? Reflect.get(c, k) : undefined;
  const machine = get('machine');
  const seed = get('seed');
  const rateKHz = get('rateKHz');
  if (typeof machine !== 'string' || !isMachine(machine)) throw new Error('feed: no machine');
  return {
    machine,
    seed: typeof seed === 'number' ? seed : 1,
    rateKHz: typeof rateKHz === 'number' ? rateKHz : 1,
  };
}

// Headless (ADR 0008): a machine's sensors, M3d task 2.
export default defineIsolate({
  start(ctx) {
    const feed = runFeed(busSource(ctx.bus), configOf(ctx.config));
    ctx.onShutdown(() => {
      feed.stop();
    });
  },
});
