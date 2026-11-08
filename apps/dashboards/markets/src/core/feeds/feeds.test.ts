import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderBook } from './book';
import { coinbase } from './coinbase';
import { kraken } from './kraken';
import { runFeed, type FeedSink, type SocketLike } from './run';

// Message shapes from each exchange's public docs.
const cbTrades = JSON.stringify({
  channel: 'market_trades',
  timestamp: '2026-11-07T12:00:00.5Z',
  events: [
    {
      type: 'update',
      trades: [
        {
          trade_id: '42',
          product_id: 'BTC-USD',
          price: '101250.50',
          size: '0.02',
          side: 'SELL',
          time: '2026-11-07T12:00:00.1Z',
        },
        {
          trade_id: '43',
          product_id: 'DOGE-USD',
          price: '0.3',
          size: '10',
          side: 'BUY',
          time: '2026-11-07T12:00:00.2Z',
        },
      ],
    },
  ],
});
const cbBook = JSON.stringify({
  channel: 'l2_data',
  timestamp: '2026-11-07T12:00:00.5Z',
  events: [
    {
      type: 'snapshot',
      product_id: 'ETH-USD',
      updates: [
        {
          side: 'bid',
          event_time: '2026-11-07T12:00:00.4Z',
          price_level: '3200.10',
          new_quantity: '1.5',
        },
        {
          side: 'offer',
          event_time: '2026-11-07T12:00:00.4Z',
          price_level: '3200.40',
          new_quantity: '0.7',
        },
      ],
    },
  ],
});
const krTrades = JSON.stringify({
  channel: 'trade',
  type: 'update',
  data: [
    {
      symbol: 'SOL/USD',
      side: 'buy',
      price: 180.25,
      qty: 3.5,
      ord_type: 'market',
      trade_id: 7,
      timestamp: '2026-11-07T12:00:01.000000Z',
    },
  ],
});
const krBook = JSON.stringify({
  channel: 'book',
  type: 'update',
  data: [
    {
      symbol: 'BTC/USD',
      bids: [{ price: 101249.9, qty: 0 }],
      asks: [{ price: 101251.1, qty: 0.4 }],
      checksum: 1,
      timestamp: '2026-11-07T12:00:01.2Z',
    },
  ],
});

describe('OrderBook', () => {
  it('keeps levels, removes size 0, and trims to a depth', () => {
    const b = new OrderBook();
    for (let i = 1; i <= 30; i++) b.set('bid', i, 1);
    b.set('ask', 31, 2);
    b.set('bid', 30, 0);
    b.trim(25);
    const top = b.top(100);
    expect(top.bids).toHaveLength(25);
    expect(top.bids[0]).toEqual([29, 1]);
    expect(top.bids.at(-1)).toEqual([5, 1]);
    expect(top.asks).toEqual([[31, 2]]);
  });
});

describe('coinbase', () => {
  it('maps trades, and skips symbols we do not show', () => {
    expect(coinbase.parse(cbTrades)).toEqual([
      {
        kind: 'trade',
        trade: {
          exchange: 'coinbase',
          symbol: 'BTC-USD',
          id: '42',
          price: 101_250.5,
          size: 0.02,
          side: 'sell',
          ts: Date.parse('2026-11-07T12:00:00.1Z'),
        },
      },
    ]);
  });

  it('maps a level2 snapshot, offers as asks', () => {
    expect(coinbase.parse(cbBook)).toEqual([
      {
        kind: 'snapshot',
        symbol: 'ETH-USD',
        bids: [[3200.1, 1.5]],
        asks: [[3200.4, 0.7]],
        ts: Date.parse('2026-11-07T12:00:00.4Z'),
      },
    ]);
  });

  it('ignores heartbeats, acks and garbage', () => {
    expect(
      coinbase.parse(JSON.stringify({ channel: 'heartbeats', events: [{ heartbeat_counter: 1 }] })),
    ).toEqual([]);
    expect(coinbase.parse('not json')).toEqual([]);
    expect(coinbase.parse(new ArrayBuffer(1))).toEqual([]);
  });

  it('subscribes to trades, level2 and heartbeats', () => {
    expect(coinbase.subscribe(['BTC-USD']).map((m) => field(m, 'channel'))).toEqual([
      'market_trades',
      'level2',
      'heartbeats',
    ]);
  });
});

describe('kraken', () => {
  it('maps trades and its symbol names', () => {
    expect(kraken.parse(krTrades)).toEqual([
      {
        kind: 'trade',
        trade: {
          exchange: 'kraken',
          symbol: 'SOL-USD',
          id: '7',
          price: 180.25,
          size: 3.5,
          side: 'buy',
          ts: Date.parse('2026-11-07T12:00:01Z'),
        },
      },
    ]);
  });

  it('maps book updates, qty 0 included (it removes the level)', () => {
    expect(kraken.parse(krBook)).toEqual([
      {
        kind: 'levels',
        symbol: 'BTC-USD',
        bids: [[101_249.9, 0]],
        asks: [[101_251.1, 0.4]],
        ts: Date.parse('2026-11-07T12:00:01.2Z'),
      },
    ]);
  });

  it('subscribes with BTC/USD-style symbols', () => {
    expect(field(kraken.subscribe(['BTC-USD'])[0] ?? '{}', 'params', 'symbol')).toEqual([
      'BTC/USD',
    ]);
  });
});

/** A socket the test drives. */
class FakeSocket implements SocketLike {
  sent: string[] = [];
  closed = false;
  readonly #on = new Map<string, ((e: { data: unknown }) => void)[]>();
  addEventListener(type: string, fn: (e: { data: unknown }) => void): void {
    this.#on.set(type, [...(this.#on.get(type) ?? []), fn]);
  }
  emit(type: string, data?: unknown): void {
    for (const fn of this.#on.get(type) ?? []) fn({ data });
  }
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.emit('close');
  }
}

const field = (m: string, ...path: string[]): unknown => {
  let v: unknown = JSON.parse(m);
  for (const k of path) v = typeof v === 'object' && v !== null ? Reflect.get(v, k) : undefined;
  return v;
};
const noTs = (v: unknown): unknown => {
  if (typeof v !== 'object' || v === null) return v;
  const { ts: _ts, ...rest } = v as { ts?: unknown };
  return rest;
};

const setup = () => {
  const sockets: FakeSocket[] = [];
  const got = { trades: 0, books: [] as unknown[], quotes: [] as unknown[] };
  const sink: FeedSink = {
    trade: () => got.trades++,
    book: (b) => got.books.push(b),
    quote: (q) => got.quotes.push(q),
  };
  const feed = runFeed(kraken, ['BTC-USD', 'SOL-USD'], sink, {
    connect: () => {
      const s = new FakeSocket();
      sockets.push(s);
      return s;
    },
  });
  return { sockets, got, feed };
};

describe('runFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes on open, then keeps a book and sends its top at most every 250 ms', () => {
    const { sockets, got, feed } = setup();
    const ws = sockets[0];
    ws?.emit('open');
    expect(ws?.sent).toHaveLength(2);
    const snap = JSON.stringify({
      channel: 'book',
      type: 'snapshot',
      data: [
        {
          symbol: 'BTC/USD',
          bids: [
            { price: 100, qty: 1 },
            { price: 99, qty: 2 },
          ],
          asks: [{ price: 101, qty: 1 }],
        },
      ],
    });
    ws?.emit('message', snap);
    ws?.emit('message', krBook.replace('101249.9', '100'));
    expect(got.books).toHaveLength(0);
    vi.advanceTimersByTime(250);
    expect(got.books.map(noTs)).toEqual([
      {
        exchange: 'kraken',
        symbol: 'BTC-USD',
        bids: [[99, 2]],
        asks: [
          [101, 1],
          [101_251.1, 0.4],
        ],
      },
    ]);
    expect(got.quotes.map(noTs)).toEqual([
      {
        exchange: 'kraken',
        symbol: 'BTC-USD',
        last: 100,
        bid: 99,
        ask: 101,
      },
    ]);
    ws?.emit('message', krTrades);
    expect(got.trades).toBe(1);
    feed.stop();
  });

  it('reconnects with doubling backoff, and stops for good', () => {
    const { sockets, feed } = setup();
    sockets[0]?.close();
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
    sockets[1]?.close();
    vi.advanceTimersByTime(1_999);
    expect(sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);
    feed.stop();
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(3);
  });
});
