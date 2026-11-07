import { describe, expect, it } from 'vitest';
import { rowWindow } from './window';

describe('rowWindow', () => {
  it('covers the viewport plus overscan, clamped to the rows there are', () => {
    expect(rowWindow(0, 220, 22, 10_000)).toEqual({ start: 0, end: 19 });
    expect(rowWindow(2_200, 220, 22, 10_000)).toEqual({ start: 92, end: 119 });
    expect(rowWindow(219_900, 220, 22, 10_000)).toEqual({ start: 9_987, end: 10_000 });
    expect(rowWindow(0, 220, 22, 5)).toEqual({ start: 0, end: 5 });
    expect(rowWindow(-50, 0, 22, 0)).toEqual({ start: 0, end: 0 });
  });
});
