import { defineIsolate, type IsolateDefinition } from '@isoloop/runtime';
import type { Feed } from '../../core/feeds/feed';
import { LIVE_SYMBOLS as SYMBOLS, type Sym } from '../../core/schemas';
import { runLiveFeed } from '../../core/services';
import { busSource } from '../../isoloop/source';

const symbolsOf = (c: unknown): readonly Sym[] => {
  const list: unknown = typeof c === 'object' && c !== null && 'symbols' in c ? c.symbols : null;
  return Array.isArray(list) ? SYMBOLS.filter((s) => list.includes(s)) : SYMBOLS;
};

/**
 * A headless isolate (ADR 0008) on one exchange's public WebSocket, into
 * trades.v1, book.v1 and prices.v1. A crash or a lost socket costs only this
 * exchange.
 */
export function feedIsolate(feed: Feed): IsolateDefinition {
  return defineIsolate({
    start(ctx) {
      runLiveFeed(busSource(ctx.bus), feed, symbolsOf(ctx.config));
    },
  });
}
