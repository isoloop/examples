import { describe, expect, it } from 'vitest';
import { applyTotals, type ApplySeen, type ApplySource } from './apply';

const iso = (id: string, applied: number, lastFrameMs: number): ApplySource => ({
  id,
  surface: { applied, lastFrameMs },
});

describe('applyTotals', () => {
  it('counts the batches since the last sample at the last frame time', () => {
    const seen = new Map<string, ApplySeen>();
    const totals = new Map<string, number>();
    applyTotals([iso('a', 10, 0.5)], seen, totals);
    expect(totals.get('a')).toBe(0); // the first sample is the starting point
    applyTotals([iso('a', 14, 0.25)], seen, totals);
    expect(totals.get('a')).toBe(1); // 4 batches × 0.25 ms
    applyTotals([iso('a', 14, 0.25)], seen, totals);
    expect(totals.get('a')).toBe(1); // nothing new
  });

  it('skips headless isolates and starts again after a restart', () => {
    const seen = new Map<string, ApplySeen>();
    const totals = new Map<string, number>();
    applyTotals([{ id: 'feed' }, iso('w', 50, 1)], seen, totals);
    applyTotals([{ id: 'feed' }, iso('w', 52, 1)], seen, totals);
    expect(totals.has('feed')).toBe(false);
    expect(totals.get('w')).toBe(2);
    // Restarted: the count is back near 0; that sample adds nothing.
    applyTotals([iso('w', 3, 1)], seen, totals);
    expect(totals.get('w')).toBe(2);
    applyTotals([iso('w', 5, 1)], seen, totals);
    expect(totals.get('w')).toBe(4);
  });
});
