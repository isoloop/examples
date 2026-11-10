import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Timings } from './schemas';
import { createTimingBatch, timingBatch } from './timing-batch';

afterEach(() => {
  vi.useRealTimers();
});

const counter = (widget: string) => {
  let ms = 0;
  return {
    add: (n: number) => {
      ms += n;
    },
    collect: () => {
      const t = { widget, ms };
      ms = 0;
      return t;
    },
  };
};

describe('timing batch', () => {
  it('publishes every slot once a second as one record', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const b = createTimingBatch();
    const sent: Timings[] = [];
    const a = counter('gauges');
    const c = counter('engine');
    b.report('T1-gauges', a.collect, (v) => sent.push(v));
    b.report('engine-fft-T1', c.collect, (v) => sent.push(v));
    a.add(3);
    c.add(5);
    vi.advanceTimersByTime(1_000);
    expect(sent).toEqual([
      {
        ts: 11_000,
        items: [
          { slot: 'T1-gauges', widget: 'gauges', ms: 3, ts: 11_000 },
          { slot: 'engine-fft-T1', widget: 'engine', ms: 5, ts: 11_000 },
        ],
      },
    ]);
    // Each collect resets its figures.
    vi.advanceTimersByTime(1_000);
    expect(sent[1]?.items.map((t) => t.ms)).toEqual([0, 0]);
  });

  it('replaces a slot reported again, and ignores the old entry stopping later', () => {
    const b = createTimingBatch();
    const sent: Timings[] = [];
    const stopOld = b.report(
      'T3-waveform',
      () => ({ widget: 'old', ms: 1 }),
      (v) => sent.push(v),
    );
    b.report(
      'T3-waveform',
      () => ({ widget: 'new', ms: 2 }),
      (v) => sent.push(v),
    );
    stopOld();
    b.flush(1);
    expect(sent[0]?.items).toEqual([{ slot: 'T3-waveform', widget: 'new', ms: 2, ts: 1 }]);
  });

  it('publishes through the next entry when one can no longer publish', () => {
    const b = createTimingBatch();
    const sent: Timings[] = [];
    b.report(
      'a',
      () => ({ widget: 'a', ms: 1 }),
      () => {
        throw new Error('port closed');
      },
    );
    b.report(
      'b',
      () => ({ widget: 'b', ms: 2 }),
      (v) => sent.push(v),
    );
    b.flush(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.items.map((t) => t.slot)).toEqual(['a', 'b']);
    // The entry that failed is dropped.
    expect(b.size).toBe(1);
  });

  it('stops its timer once the last slot stops', () => {
    vi.useFakeTimers();
    const b = createTimingBatch();
    const publish = vi.fn();
    const stop = b.report('x', () => ({ widget: 'x', ms: 0 }), publish);
    stop();
    vi.advanceTimersByTime(5_000);
    expect(publish).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is one batch per thread', () => {
    expect(timingBatch()).toBe(timingBatch());
  });
});
