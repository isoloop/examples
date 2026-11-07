// OKX's public WebSocket v5: `trades` and `books5` (the top 5 levels a side,
// a snapshot each push). OKX lists these coins against USDT, not USD, so its
// prices carry the USDT premium; the dashboard shows them as USD, and the
// cross-market spread includes it. It closes a socket that's quiet for 30 s,
// so the feed sends "ping" every 20 s.
import { SYMBOLS, type Sym } from '../schemas';
import { isObj, json, num, type Feed, type FeedEvent } from './feed';

const inst = (s: Sym): string => s.replace('-USD', '-USDT');
const sym = (v: unknown): Sym | null => SYMBOLS.find((s) => inst(s) === v) ?? null;
const levels = (v: unknown): [number, number][] =>
  Array.isArray(v)
    ? v.flatMap((l): [number, number][] => (Array.isArray(l) ? [[num(l[0]), num(l[1])]] : []))
    : [];

export const okx: Feed = {
  exchange: 'okx',
  url: 'wss://ws.okx.com/ws/v5/public',
  keepalive: { everyMs: 20_000, message: 'ping' },
  subscribe: (symbols) => [
    JSON.stringify({
      op: 'subscribe',
      args: symbols.flatMap((s) => [
        { channel: 'trades', instId: inst(s) },
        { channel: 'books5', instId: inst(s) },
      ]),
    }),
  ],
  parse(data) {
    const m = json(data);
    if (!isObj(m) || !isObj(m['arg']) || !Array.isArray(m['data'])) return [];
    const channel = m['arg']['channel'];
    const out: FeedEvent[] = [];
    for (const d of m['data']) {
      if (!isObj(d)) continue;
      const symbol = sym(d['instId'] ?? m['arg']['instId']);
      if (!symbol) continue;
      if (channel === 'trades') {
        out.push({
          kind: 'trade',
          trade: {
            exchange: 'okx',
            symbol,
            id: String(d['tradeId']),
            price: num(d['px']),
            size: num(d['sz']),
            side: d['side'] === 'sell' ? 'sell' : 'buy',
            ts: num(d['ts']),
          },
        });
      } else if (channel === 'books5') {
        out.push({
          kind: 'snapshot',
          symbol,
          bids: levels(d['bids']),
          asks: levels(d['asks']),
          ts: num(d['ts']),
        });
      }
    }
    return out;
  },
};
