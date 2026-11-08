import { describe, expect, it } from 'vitest';
import { drawChart } from './canvas-chart';

/** Records the calls a 2D context gets. */
function recorder() {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_t, k) =>
        typeof k === 'string' ? (...a: unknown[]) => calls.push(`${k}(${a.length})`) : undefined,
      set: () => true,
    },
  );
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the proxy answers every method a 2D context has
  return { ctx: ctx as CanvasRenderingContext2D, calls };
}

describe('drawChart', () => {
  it('says it is waiting with no points', () => {
    const { ctx, calls } = recorder();
    drawChart(ctx, 300, 120, [], { title: 'Price' });
    expect(calls.filter((c) => c.startsWith('fillText'))).toHaveLength(2);
  });

  it('draws a line per series and bars for the first series', () => {
    const { ctx, calls } = recorder();
    const points = [
      [0, 1],
      [1, 2],
      [2, 1.5],
    ] as const;
    drawChart(
      ctx,
      300,
      120,
      [
        { label: 'a', color: '#000', points },
        { label: 'b', color: '#111', points },
      ],
      { title: 'Price' },
    );
    expect(calls.filter((c) => c === 'stroke(0)')).toHaveLength(2);
    const bars = recorder();
    drawChart(bars.ctx, 300, 120, [{ label: 'v', color: '#000', points }], {
      title: 'Volume',
      bars: true,
    });
    expect(bars.calls.filter((c) => c === 'fillRect(4)')).toHaveLength(3);
  });
});
