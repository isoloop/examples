import { describe, expect, it } from 'vitest';
import type { Sym, Trade } from '../schemas';
import { CorrelationEngine, pearson } from './correlations';

const trade = (symbol: Sym, price: number): Trade => ({
  exchange: 'okx',
  symbol,
  id: `${symbol}-${price}`,
  price,
  size: 1,
  side: 'buy',
  ts: 0,
});

describe('CorrelationEngine', () => {
  it('gives a known matrix for fixed price paths', () => {
    const e = new CorrelationEngine(60_000);
    // A and B move identically, C moves opposite (prices as exp of a walk).
    const walk = [0, 0.01, -0.005, 0.02, 0.0, -0.01, 0.015];
    let acc = 0;
    for (const step of walk) {
      acc += step;
      e.addTrade(trade('BTC-USD', 100 * Math.exp(acc)));
      e.addTrade(trade('ETH-USD', 50 * Math.exp(acc)));
      e.addTrade(trade('SOL-USD', 10 * Math.exp(-acc)));
      e.sample();
    }
    const c = e.compute(60_000, 123);
    expect(c?.symbols).toEqual(['BTC-USD', 'ETH-USD', 'SOL-USD']);
    const m = c?.matrix ?? [];
    const at = (i: number, j: number): number => m[i * 3 + j] ?? Number.NaN;
    for (let i = 0; i < 3; i++) expect(at(i, i)).toBe(1);
    expect(at(0, 1)).toBeCloseTo(1, 10);
    expect(at(0, 2)).toBeCloseTo(-1, 10);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(at(i, j)).toBe(at(j, i));
    expect(c?.horizonMs).toBe(60_000);
    expect(c?.ts).toBe(123);
  });

  it('uses only the horizon’s tail, and needs two symbols with data', () => {
    const e = new CorrelationEngine(900_000);
    expect(e.compute(60_000, 0)).toBeNull();
    for (let i = 0; i < 10; i++) {
      e.addTrade(trade('BTC-USD', 100 + i));
      e.sample();
    }
    expect(e.compute(60_000, 0)).toBeNull();
  });

  it('pearson is 0 for a flat series and matches a hand computation', () => {
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
    expect(pearson([1, 2, 3, 4], [2, 4, 5, 9])).toBeCloseTo(11 / Math.sqrt(130), 10);
  });
});
