import { describe, expect, it } from 'vitest';
import { filtersFrom, replayConfig } from './url';

describe('replayConfig', () => {
  it('reads the replay settings, with defaults', () => {
    expect(replayConfig(new URLSearchParams(''))).toEqual({
      speed: 1,
      seed: 1,
      tradesPerSecond: 2,
    });
    expect(replayConfig(new URLSearchParams('speed=10&seed=7&tps=25&for=20000&at=1234'))).toEqual({
      speed: 10,
      seed: 7,
      tradesPerSecond: 25,
      durationMs: 20_000,
      from: 1_234,
    });
  });
});

describe('filtersFrom', () => {
  it('reads symbol, exchanges and window', () => {
    expect(filtersFrom(new URLSearchParams('symbol=ETH-USD&ex=okx,kraken&win=10000'))).toEqual({
      symbols: ['ETH-USD'],
      exchanges: ['kraken', 'okx'],
      windowMs: 10_000,
    });
  });

  it('is undefined without filters, or with nothing valid', () => {
    expect(filtersFrom(new URLSearchParams('speed=10'))).toBeUndefined();
    expect(filtersFrom(new URLSearchParams('symbol=DOGE&ex=okx'))).toBeUndefined();
  });
});
