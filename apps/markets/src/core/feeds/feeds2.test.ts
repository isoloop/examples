import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bitstamp } from './bitstamp';
import { okx } from './okx';
import { runFeed, type SocketLike } from './run';

describe('bitstamp', () => {
  it('maps live trades (type 1 is a sell, microtimestamp in µs)', () => {
    const msg = JSON.stringify({
      event: 'trade',
      channel: 'live_trades_ethusd',
      data: { id: 99, amount: 0.5, price: 3200.5, type: 1, microtimestamp: '1794054457268266' },
    });
    expect(bitstamp.parse(msg)).toEqual([
      {
        kind: 'trade',
        trade: {
          exchange: 'bitstamp',
          symbol: 'ETH-USD',
          id: '99',
          price: 3200.5,
          size: 0.5,
          side: 'sell',
          ts: 1_794_054_457_268,
        },
      },
    ]);
  });

  it('maps every order_book push as a snapshot, and skips acks and other pairs', () => {
    const msg = JSON.stringify({
      event: 'data',
      channel: 'order_book_btcusd',
      data: {
        microtimestamp: '1794054457000000',
        bids: [['100.5', '1.25']],
        asks: [['101', '0.5']],
      },
    });
    expect(bitstamp.parse(msg)).toEqual([
      {
        kind: 'snapshot',
        symbol: 'BTC-USD',
        bids: [[100.5, 1.25]],
        asks: [[101, 0.5]],
        ts: 1_794_054_457_000,
      },
    ]);
    expect(
      bitstamp.parse(
        JSON.stringify({
          event: 'bts:subscription_succeeded',
          channel: 'order_book_btcusd',
          data: {},
        }),
      ),
    ).toEqual([]);
    expect(
      bitstamp.parse(JSON.stringify({ event: 'data', channel: 'order_book_xrpusd', data: {} })),
    ).toEqual([]);
  });

  it('subscribes to both channels per pair', () => {
    expect(bitstamp.subscribe(['SOL-USD'])).toEqual([
      '{"event":"bts:subscribe","data":{"channel":"live_trades_solusd"}}',
      '{"event":"bts:subscribe","data":{"channel":"order_book_solusd"}}',
    ]);
  });
});

describe('okx', () => {
  it('maps USDT instruments to our USD symbols', () => {
    const msg = JSON.stringify({
      arg: { channel: 'trades', instId: 'BTC-USDT' },
      data: [
        {
          instId: 'BTC-USDT',
          tradeId: '5',
          px: '76013.2',
          sz: '0.01',
          side: 'sell',
          ts: '1794054457268',
        },
      ],
    });
    expect(okx.parse(msg)).toEqual([
      {
        kind: 'trade',
        trade: {
          exchange: 'okx',
          symbol: 'BTC-USD',
          id: '5',
          price: 76_013.2,
          size: 0.01,
          side: 'sell',
          ts: 1_794_054_457_268,
        },
      },
    ]);
  });

  it('maps books5 as snapshots and ignores events and pongs', () => {
    const msg = JSON.stringify({
      arg: { channel: 'books5', instId: 'SOL-USDT' },
      data: [
        {
          asks: [['180.3', '4', '0', '1']],
          bids: [['180.1', '2', '0', '3']],
          instId: 'SOL-USDT',
          ts: '1794054457000',
        },
      ],
    });
    expect(okx.parse(msg)).toEqual([
      {
        kind: 'snapshot',
        symbol: 'SOL-USD',
        bids: [[180.1, 2]],
        asks: [[180.3, 4]],
        ts: 1_794_054_457_000,
      },
    ]);
    expect(
      okx.parse(
        JSON.stringify({ event: 'subscribe', arg: { channel: 'trades', instId: 'BTC-USDT' } }),
      ),
    ).toEqual([]);
    expect(okx.parse('pong')).toEqual([]);
  });
});

class Socket implements SocketLike {
  sent: string[] = [];
  readonly #on = new Map<string, ((e: { data: unknown }) => void)[]>();
  addEventListener(type: string, fn: (e: { data: unknown }) => void): void {
    this.#on.set(type, [...(this.#on.get(type) ?? []), fn]);
  }
  emit(type: string): void {
    for (const fn of this.#on.get(type) ?? []) fn({ data: undefined });
  }
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    this.emit('close');
  }
}

describe('keepalive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pings OKX every 20 s while open, and stops when closed', () => {
    const ws = new Socket();
    const feed = runFeed(
      okx,
      ['BTC-USD'],
      { trade() {}, book() {}, quote() {} },
      { connect: () => ws },
    );
    ws.emit('open');
    vi.advanceTimersByTime(40_000);
    expect(ws.sent.filter((m) => m === 'ping')).toHaveLength(2);
    feed.stop();
    vi.advanceTimersByTime(40_000);
    expect(ws.sent.filter((m) => m === 'ping')).toHaveLength(2);
  });
});
