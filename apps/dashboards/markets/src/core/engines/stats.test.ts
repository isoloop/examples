import { describe, expect, it } from 'vitest';
import type { Trade } from '../schemas';
import { PROFILE_BINS, StatsEngine, stddev } from './stats';

const t = (ts: number, price: number, size: number): Trade => ({
  exchange: 'coinbase',
  symbol: 'ETH-USD',
  id: `t${ts}`,
  price,
  size,
  side: 'buy',
  ts,
});

describe('StatsEngine', () => {
  it('computes VWAP, volatility and the volume profile for a fixed set of trades', () => {
    const e = new StatsEngine();
    // One trade a second at 100, 101, 100, 102: sizes 1, 2, 1, 4.
    for (const [ts, p, s] of [
      [1_000, 100, 1],
      [2_000, 101, 2],
      [3_000, 100, 1],
      [4_000, 102, 4],
    ] as const) {
      e.addTrade(t(ts, p, s));
    }
    const s = e.compute('ETH-USD', 4_500, 10_000);
    expect(s).not.toBeNull();
    expect(s?.vwap).toBeCloseTo((100 + 202 + 100 + 408) / 8, 10);
    expect(s?.volume).toBe(8);
    expect(s?.trades).toBe(4);
    expect(s?.lo).toBe(100);
    expect(s?.hi).toBe(102);
    const r = [Math.log(101 / 100), Math.log(100 / 101), Math.log(102 / 100)];
    expect(s?.volatility).toBeCloseTo(stddev(r), 12);
    expect(s?.profile).toHaveLength(PROFILE_BINS);
    expect(s?.profile.reduce((a, b) => a + b, 0)).toBe(8);
    expect(s?.profile[0]).toBe(2); // both trades at 100
    expect(s?.profile[PROFILE_BINS - 1]).toBe(4); // the trade at the high
  });

  it('drops trades older than the window, and needs two', () => {
    const e = new StatsEngine();
    e.addTrade(t(1_000, 100, 1));
    e.addTrade(t(9_000, 101, 1));
    expect(e.compute('ETH-USD', 10_000, 5_000)).toBeNull();
    expect(e.compute('BTC-USD', 10_000, 5_000)).toBeNull();
  });

  it('stddev is the sample standard deviation', () => {
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stddev([1])).toBe(0);
  });
});
