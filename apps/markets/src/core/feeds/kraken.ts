// Kraken's WebSocket v2: `trade` and `book` (depth 25; a snapshot, then
// updates where qty 0 removes a level). Symbols are `BTC/USD`.
import { SYMBOLS, type Sym } from '../schemas';
import { isObj, json, num, time, type Feed, type FeedEvent } from './feed';

const sym = (v: unknown): Sym | null =>
  typeof v === 'string' ? (SYMBOLS.find((s) => s === v.replace('/', '-')) ?? null) : null;

const levels = (v: unknown): [number, number][] =>
  Array.isArray(v)
    ? v.flatMap((l): [number, number][] => (isObj(l) ? [[num(l['price']), num(l['qty'])]] : []))
    : [];

export const kraken: Feed = {
  exchange: 'kraken',
  url: 'wss://ws.kraken.com/v2',
  subscribe(symbols) {
    const symbol = symbols.map((s) => s.replace('-', '/'));
    return [
      JSON.stringify({ method: 'subscribe', params: { channel: 'trade', symbol } }),
      JSON.stringify({ method: 'subscribe', params: { channel: 'book', symbol, depth: 25 } }),
    ];
  },
  parse(data) {
    const m = json(data);
    if (!isObj(m) || !Array.isArray(m['data'])) return [];
    const out: FeedEvent[] = [];
    for (const d of m['data']) {
      if (!isObj(d)) continue;
      const symbol = sym(d['symbol']);
      if (!symbol) continue;
      if (m['channel'] === 'trade') {
        out.push({
          kind: 'trade',
          trade: {
            exchange: 'kraken',
            symbol,
            id: String(d['trade_id']),
            price: num(d['price']),
            size: num(d['qty']),
            side: d['side'] === 'sell' ? 'sell' : 'buy',
            ts: time(d['timestamp']),
          },
        });
      } else if (m['channel'] === 'book') {
        out.push({
          kind: m['type'] === 'snapshot' ? 'snapshot' : 'levels',
          symbol,
          bids: levels(d['bids']),
          asks: levels(d['asks']),
          ts: time(d['timestamp']) || Date.now(),
        });
      }
    }
    return out;
  },
};
