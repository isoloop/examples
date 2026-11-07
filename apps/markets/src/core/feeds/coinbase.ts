// Coinbase Advanced Trade's public market data WebSocket: `market_trades`
// and `level2` (snapshot, then updates), products named like ours.
import { LIVE_SYMBOLS as SYMBOLS, type Sym } from '../schemas';
import { isObj, json, num, time, type Feed, type FeedEvent } from './feed';

const sym = (v: unknown): Sym | null => SYMBOLS.find((s) => s === v) ?? null;

export const coinbase: Feed = {
  exchange: 'coinbase',
  url: 'wss://advanced-trade-ws.coinbase.com',
  subscribe: (symbols) =>
    ['market_trades', 'level2', 'heartbeats'].map((channel) =>
      JSON.stringify({ type: 'subscribe', product_ids: symbols, channel }),
    ),
  parse(data) {
    const m = json(data);
    if (!isObj(m) || !Array.isArray(m['events'])) return [];
    const out: FeedEvent[] = [];
    for (const e of m['events']) {
      if (!isObj(e)) continue;
      if (m['channel'] === 'market_trades' && Array.isArray(e['trades'])) {
        for (const t of e['trades']) {
          if (!isObj(t)) continue;
          const symbol = sym(t['product_id']);
          if (!symbol) continue;
          out.push({
            kind: 'trade',
            trade: {
              exchange: 'coinbase',
              symbol,
              id: String(t['trade_id']),
              price: num(t['price']),
              size: num(t['size']),
              side: t['side'] === 'SELL' ? 'sell' : 'buy',
              ts: time(t['time']),
            },
          });
        }
      } else if (m['channel'] === 'l2_data' && Array.isArray(e['updates'])) {
        const symbol = sym(e['product_id']);
        if (!symbol) continue;
        const bids: [number, number][] = [];
        const asks: [number, number][] = [];
        let ts = time(m['timestamp']);
        for (const u of e['updates']) {
          if (!isObj(u)) continue;
          const level: [number, number] = [num(u['price_level']), num(u['new_quantity'])];
          (u['side'] === 'bid' ? bids : asks).push(level);
          ts = time(u['event_time']) || ts;
        }
        out.push({
          kind: e['type'] === 'snapshot' ? 'snapshot' : 'levels',
          symbol,
          bids,
          asks,
          ts,
        });
      }
    }
    return out;
  },
};
