import { defineIsolate } from '@isoloop/runtime';
import { Aggregator } from '../core/aggregate';
import { SYMBOLS } from '../core/schemas';
import { aggregates, filters, prices, trades } from '../isoloop/topics';

const DEFAULT_WINDOW_MS = 60_000;

// Headless: cross-market VWAP, spread and volume per symbol, once a second,
// into aggregates.v1. The window comes from filters.v1.
export default defineIsolate({
  start(ctx) {
    const agg = new Aggregator();
    let windowMs = DEFAULT_WINDOW_MS;
    ctx.bus.subscribe(trades, (r) => {
      agg.addTrade(r.value);
    });
    ctx.bus.subscribe(
      prices,
      (r) => {
        agg.setQuote(r.value);
      },
      { from: 'earliest' },
    );
    ctx.bus.subscribe(
      filters,
      (r) => {
        windowMs = r.value.windowMs;
      },
      { from: 'earliest' },
    );
    setInterval(() => {
      const now = Date.now();
      for (const s of SYMBOLS) {
        const value = agg.compute(s, now, windowMs);
        if (value) void ctx.bus.publish(aggregates, { value });
      }
    }, 1_000);
  },
});
