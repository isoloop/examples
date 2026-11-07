import { defineIsolate } from '@isoloop/runtime';
import { play } from '../core/replay/player';
import { synth } from '../core/replay/synth';
import { book, trades } from '../isoloop/topics';

export interface ReplayConfig {
  seed?: number;
  /** N× speed; 1 is real time. */
  speed?: number;
  tradesPerSecond?: number;
}

const isConfig = (c: unknown): c is ReplayConfig => typeof c === 'object' && c !== null;

// Headless (ADR 0008): the replay source, in place of the live feeds. It
// publishes synthesized ticks to trades.v1 and book.v1 at N× speed.
export default defineIsolate({
  start(ctx) {
    const c = isConfig(ctx.config) ? ctx.config : {};
    play(
      synth({ seed: c.seed ?? 1, startTs: Date.now(), tradesPerSecond: c.tradesPerSecond ?? 2 }),
      (tick) => {
        if (tick.kind === 'trade') void ctx.bus.publish(trades, { value: tick.rec });
        else void ctx.bus.publish(book, { value: tick.rec });
      },
      { speed: c.speed ?? 1 },
    );
  },
});
