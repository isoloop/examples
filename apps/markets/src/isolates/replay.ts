import { defineIsolate } from '@isoloop/runtime';
import { play } from '../core/replay/player';
import { synth } from '../core/replay/synth';
import { restamp } from '../core/replay/tick';
import { book, prices, trades } from '../isoloop/topics';

export interface ReplayConfig {
  seed?: number;
  /** N× speed; 1 is real time. */
  speed?: number;
  tradesPerSecond?: number;
}

const isConfig = (c: unknown): c is ReplayConfig => typeof c === 'object' && c !== null;

// Headless (ADR 0008): the replay source, in place of the live feeds. It
// publishes synthesized ticks to trades.v1 and book.v1 at N× speed, and
// keeps prices.v1 current like the feeds do.
export default defineIsolate({
  start(ctx) {
    const c = isConfig(ctx.config) ? ctx.config : {};
    // Quotes as the live feeds make them: the book's top and the last trade.
    const last = new Map<string, number>();
    play(
      synth({ seed: c.seed ?? 1, startTs: Date.now(), tradesPerSecond: c.tradesPerSecond ?? 2 }),
      (played) => {
        // Records carry the time they're played, not recorded: at 10× the
        // recording runs ahead of the wall clock, and windows are wall time.
        const tick = restamp(played, Date.now());
        const key = `${tick.rec.exchange}:${tick.rec.symbol}`;
        if (tick.kind === 'trade') {
          last.set(key, tick.rec.price);
          void ctx.bus.publish(trades, { value: tick.rec });
          return;
        }
        const b = tick.rec;
        void ctx.bus.publish(book, { value: b });
        const bid = b.bids[0]?.[0];
        const ask = b.asks[0]?.[0];
        if (bid === undefined || ask === undefined) return;
        const value = {
          exchange: b.exchange,
          symbol: b.symbol,
          last: last.get(key) ?? (bid + ask) / 2,
          bid,
          ask,
          ts: b.ts,
        };
        void ctx.bus.publish(prices, { key, value });
      },
      { speed: c.speed ?? 1 },
    );
  },
});
