import { describe, expect, it, vi } from 'vitest';
import { perFrame, ring } from './hooks';

describe('ring', () => {
  it('keeps the last n values, oldest first', () => {
    const r = ring<number>(3);
    expect(r.toArray()).toEqual([]);
    r.push(1).push(2);
    expect(r.toArray()).toEqual([1, 2]);
    r.push(3).push(4).push(5);
    expect(r.toArray()).toEqual([3, 4, 5]);
    r.push(6).push(7).push(8);
    expect(r.toArray()).toEqual([6, 7, 8]);
  });

  it('hands out a copy', () => {
    const r = ring<number>(2).push(1);
    const a = r.toArray();
    r.push(2);
    expect(a).toEqual([1]);
  });
});

describe('perFrame', () => {
  it('runs once for many requests in one frame', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const f = perFrame(fn);
    for (let i = 0; i < 1_000; i++) f.request();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(16);
    expect(fn).toHaveBeenCalledTimes(1);
    f.request();
    f.cancel();
    vi.advanceTimersByTime(16);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
