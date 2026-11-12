import { describe, expect, it } from 'vitest';
import { FLEET_WINDOW_MS, STATS_WINDOW_MS } from './engines';
import { MACHINE_KEEP, SLOW_KEEP_MS, TREND_MS, type Keep } from './retention';
import { SCALARS_MS } from './sensors/signals';

const msOf = (k: Keep): number => {
  if (k.kind !== 'time') throw new Error(`expected time retention, got ${k.kind}`);
  return k.ms;
};

describe('retention', () => {
  it('keeps slow signals as long as their longest reader, and no longer', () => {
    // The trend (2 min) and the stats engine (60 s) read `scalars` back on start.
    const longest = Math.max(TREND_MS, STATS_WINDOW_MS);
    expect(msOf(MACHINE_KEEP.scalars)).toBe(longest);
  });

  it('keeps health as long as the fleet engine reads it back', () => {
    expect(msOf(MACHINE_KEEP.health)).toBeGreaterThanOrEqual(FLEET_WINDOW_MS);
    expect(msOf(MACHINE_KEEP.health)).toBe(SLOW_KEEP_MS);
  });

  it('keeps a whole number of trend rows', () => {
    expect(TREND_MS % SCALARS_MS).toBe(0);
    expect(TREND_MS / SCALARS_MS).toBe(600);
  });
});
