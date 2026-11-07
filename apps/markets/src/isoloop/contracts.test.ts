import { testContracts } from '@isoloop/bus/testing';
import { describe, expect, it } from 'vitest';
import * as s from '../core/schemas';
import list from './contracts';

const ts = 1_762_500_000_000;
const samples = {
  'trades.v1': [
    {
      exchange: 'coinbase',
      symbol: 'BTC-USD',
      id: 't1',
      price: 101_250.5,
      size: 0.02,
      side: 'buy',
      ts,
    },
  ],
  'book.v1': [
    {
      exchange: 'kraken',
      symbol: 'ETH-USD',
      bids: [[3_200.1, 1.5]],
      asks: [[3_200.4, 0.7]],
      ts,
    },
  ],
  'prices.v1': [{ exchange: 'okx', symbol: 'SOL-USD', last: 180.2, bid: 180.1, ask: 180.3, ts }],
  'aggregates.v1': [
    { symbol: 'BTC-USD', vwap: 101_249.9, spread: -0.4, volume: 12.5, windowMs: 60_000, ts },
  ],
  'alert-rules.v1': [
    { removed: false, id: 'r1', symbol: 'BTC-USD', metric: 'price', op: 'above', threshold: 1e5 },
    { removed: true, id: 'r1' },
  ],
  'alerts.v1': [
    {
      ruleId: 'r1',
      symbol: 'BTC-USD',
      metric: 'price',
      op: 'above',
      threshold: 1e5,
      value: 100_001,
      ts,
    },
  ],
  'noise.v1': [{ widget: 'price', n: 0, ts }],
  'filters.v1': [{ symbols: ['BTC-USD'], exchanges: ['coinbase', 'kraken'], windowMs: 60_000 }],
  'correlations.v1': [
    { horizonMs: 60_000, symbols: ['BTC-USD', 'ETH-USD'], matrix: [1, 0.8, 0.8, 1], ts },
  ],
  'depth.v1': [
    { symbol: 'BTC-USD', mid: 100_000, step: 0.0001, bids: [1.5, 2], asks: [1.25, 3], ts },
  ],
  'stats.v1': [
    {
      symbol: 'ETH-USD',
      vwap: 3_201.2,
      volatility: 0.0004,
      volume: 120.5,
      trades: 340,
      lo: 3_190,
      hi: 3_210,
      profile: [1, 2, 3],
      windowMs: 60_000,
      ts,
    },
  ],
};

describe('contracts', () => {
  it('accepts a sample of every topic, as plain data', async () => {
    expect(await testContracts(list, samples)).toEqual([]);
  });

  it('rejects records that are wrong in the ways feeds go wrong', () => {
    const t = samples['trades.v1'][0];
    expect(s.trade.safeParse({ ...t, price: 0 }).success).toBe(false);
    expect(s.trade.safeParse({ ...t, price: Number.NaN }).success).toBe(false);
    expect(s.trade.safeParse({ ...t, symbol: 'PEPE-USD' }).success).toBe(false);
    expect(s.filters.safeParse({ symbols: [], exchanges: ['okx'], windowMs: 1 }).success).toBe(
      false,
    );
  });
});
