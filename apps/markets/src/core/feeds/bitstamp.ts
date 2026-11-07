// Bitstamp's WebSocket v2: `live_trades_<pair>` and `order_book_<pair>`, which
// sends the top 100 levels a side on every change (a snapshot each time).
import { LIVE_SYMBOLS as SYMBOLS, type Sym } from '../schemas';
import { isObj, json, num, type Feed, type FeedEvent } from './feed';

const pair = (s: Sym): string => s.replace('-', '').toLowerCase();
const fromChannel = (c: unknown): { kind: 'trade' | 'book'; symbol: Sym } | null => {
  if (typeof c !== 'string') return null;
  const m = /^(live_trades|order_book)_([a-z]+)$/.exec(c);
  const symbol = m ? SYMBOLS.find((s) => pair(s) === m[2]) : undefined;
  return m && symbol ? { kind: m[1] === 'live_trades' ? 'trade' : 'book', symbol } : null;
};
const levels = (v: unknown): [number, number][] =>
  Array.isArray(v)
    ? v.flatMap((l): [number, number][] => (Array.isArray(l) ? [[num(l[0]), num(l[1])]] : []))
    : [];
/** `microtimestamp` is µs since the epoch, as a string. */
const micros = (v: unknown): number => Math.floor(num(v) / 1000);

export const bitstamp: Feed = {
  exchange: 'bitstamp',
  url: 'wss://ws.bitstamp.net',
  subscribe: (symbols) =>
    symbols.flatMap((s) =>
      ['live_trades', 'order_book'].map((c) =>
        JSON.stringify({ event: 'bts:subscribe', data: { channel: `${c}_${pair(s)}` } }),
      ),
    ),
  parse(data) {
    const m = json(data);
    if (!isObj(m) || !isObj(m['data'])) return [];
    const ch = fromChannel(m['channel']);
    if (!ch) return [];
    const d = m['data'];
    const out: FeedEvent[] = [];
    if (ch.kind === 'trade' && m['event'] === 'trade') {
      out.push({
        kind: 'trade',
        trade: {
          exchange: 'bitstamp',
          symbol: ch.symbol,
          id: String(d['id']),
          price: num(d['price']),
          size: num(d['amount']),
          side: d['type'] === 1 ? 'sell' : 'buy',
          ts: micros(d['microtimestamp']),
        },
      });
    } else if (ch.kind === 'book' && m['event'] === 'data') {
      out.push({
        kind: 'snapshot',
        symbol: ch.symbol,
        bids: levels(d['bids']),
        asks: levels(d['asks']),
        ts: micros(d['microtimestamp']),
      });
    }
    return out;
  },
};
