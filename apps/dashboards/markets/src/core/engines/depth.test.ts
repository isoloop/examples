import { describe, expect, it } from 'vitest';
import type { Book } from '../schemas';
import { DEPTH_BUCKETS, DepthEngine } from './depth';

const book = (exchange: Book['exchange'], bids: Book['bids'], asks: Book['asks']): Book => ({
  exchange,
  symbol: 'BTC-USD',
  bids,
  asks,
  ts: 0,
});

describe('DepthEngine', () => {
  it('merges the latest book of each exchange into buckets around the mid', () => {
    const e = new DepthEngine();
    // Mid 100,000; a bucket is 10 wide (1 bp).
    e.setBook(
      book(
        'coinbase',
        [
          [99_995, 1],
          [99_985, 2],
        ],
        [
          [100_005, 1],
          [100_015, 3],
        ],
      ),
    );
    e.setBook(
      book(
        'kraken',
        [[99_994, 0.5]],
        [
          [100_006, 0.25],
          [100_300, 9],
        ],
      ),
    );
    const d = e.compute('BTC-USD', 42);
    expect(d?.mid).toBe(100_000);
    expect(d?.bids).toHaveLength(DEPTH_BUCKETS);
    expect(d?.bids[0]).toBe(1.5); // 99,995 and 99,994
    expect(d?.bids[1]).toBe(2); // 99,985
    expect(d?.asks[0]).toBe(1.25); // 100,005 and 100,006
    expect(d?.asks[1]).toBe(3); // 100,015
    // 100,300 is 30 buckets out: left out.
    expect(d?.asks.reduce((a, b) => a + b, 0)).toBe(4.25);
    expect(d?.ts).toBe(42);
  });

  it('keeps only each exchange’s latest book', () => {
    const e = new DepthEngine();
    e.setBook(book('okx', [[99_995, 5]], [[100_005, 5]]));
    e.setBook(book('okx', [[99_995, 1]], [[100_005, 2]]));
    const d = e.compute('BTC-USD', 0);
    expect(d?.bids[0]).toBe(1);
    expect(d?.asks[0]).toBe(2);
  });

  it('is null without a book', () => {
    expect(new DepthEngine().compute('ETH-USD', 0)).toBeNull();
  });
});
