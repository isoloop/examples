import { defineIsolate, type IsolateDefinition } from '@isoloop/runtime';
import type { Feed } from '../../core/feeds/feed';
import { runFeed } from '../../core/feeds/run';
import { SYMBOLS, type Sym } from '../../core/schemas';
import { book, prices, trades } from '../../isoloop/topics';

const symbolsOf = (c: unknown): readonly Sym[] => {
  const list: unknown = typeof c === 'object' && c !== null && 'symbols' in c ? c.symbols : null;
  return Array.isArray(list) ? SYMBOLS.filter((s) => list.includes(s)) : SYMBOLS;
};

/**
 * A headless isolate (ADR 0008) on one exchange's public WebSocket: it maps
 * messages to trades.v1 and book.v1 and keeps prices.v1 current, one key per
 * exchange and symbol. A crash or a lost socket costs only this exchange.
 */
export function feedIsolate(feed: Feed): IsolateDefinition {
  return defineIsolate({
    start(ctx) {
      runFeed(feed, symbolsOf(ctx.config), {
        trade: (value) => void ctx.bus.publish(trades, { value }),
        book: (value) => void ctx.bus.publish(book, { value }),
        quote: (value) =>
          void ctx.bus.publish(prices, { key: `${value.exchange}:${value.symbol}`, value }),
      });
    },
  });
}
