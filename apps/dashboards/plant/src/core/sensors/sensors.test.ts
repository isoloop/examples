import { decode, encode } from '@isoloop/codec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MACHINES, SENSOR } from '../machines';
import type { Source, StreamName } from '../streams';
import { CYCLE_MS, faultAt, faultsBetween, FAULT_KINDS, type Fault } from './faults';
import { due, runFeed } from './feed';
import { CHUNK_MS, scalarsAt, vibChunk } from './signals';

const T = 1_800_000_000_000; // a fixed moment, ms since the epoch
const rms = (xs: Float32Array): number => Math.sqrt(xs.reduce((n, x) => n + x * x, 0) / xs.length);
const chunkAt = (seed: number, m: (typeof MACHINES)[number], rate: number, ts: number) =>
  vibChunk(seed, m, rate, Math.floor(ts / CHUNK_MS));

const late = (f: Fault): number => f.start + 0.8 * (f.end - f.start);

describe('the generator', () => {
  it('gives the same chunks and rows for the same seed', () => {
    for (const m of MACHINES) {
      expect(vibChunk(1, m, 1, 36_000_000_000)).toEqual(vibChunk(1, m, 1, 36_000_000_000));
      expect(scalarsAt(7, m, T)).toEqual(scalarsAt(7, m, T));
    }
    expect(vibChunk(1, 'T1', 1, 36_000_000_000).values).not.toEqual(
      vibChunk(2, 'T1', 1, 36_000_000_000).values,
    );
  });

  it('sizes a chunk by the rate: 50 samples at 1 kHz, 250 at 5 kHz', () => {
    expect(vibChunk(1, 'T1', 1, 1).values).toHaveLength(50);
    expect(vibChunk(1, 'T1', 2, 1).values).toHaveLength(100);
    const c = vibChunk(1, 'T1', 5, 1);
    expect(c.values).toHaveLength(250);
    expect(c.dtMs).toBe(0.2);
    expect(c.t0).toBe(CHUNK_MS);
  });

  it('keeps plausible values in normal running', () => {
    for (const m of MACHINES) {
      const s = scalarsAt(1, m, T);
      if (faultAt(1, m, T)) continue;
      expect(s.speed).toBeGreaterThan(1_000);
      expect(s.bearingTemp).toBeLessThan(SENSOR.bearingTemp.warn ?? 0);
      expect(s.exhaustTemp).toBeLessThan(SENSOR.exhaustTemp.warn ?? 0);
      expect(rms(chunkAt(1, m, 1, T).values)).toBeLessThan(SENSOR.vib.warn ?? 0);
    }
  });
});

describe('the fault schedule', () => {
  const faults = faultsBetween(1, T, T + 20 * CYCLE_MS);
  const first = (kind: Fault['kind']): Fault => {
    const f = faults.find((x) => x.kind === kind);
    if (!f) throw new Error(`no ${kind} in 20 cycles`);
    return f;
  };

  it('injects every kind of fault, about one per machine every other cycle', () => {
    expect(new Set(faults.map((f) => f.kind))).toEqual(new Set(FAULT_KINDS));
    expect(faults.length).toBeGreaterThan(8 * 20 * 0.3);
    expect(faults.length).toBeLessThan(8 * 20 * 0.7);
  });

  it('has nothing just before a fault starts, and the fault just after', () => {
    for (const f of faults) {
      expect(faultAt(1, f.machine, f.start - 1)).toBeNull();
      expect(faultAt(1, f.machine, f.start)).toEqual(f);
      expect(faultAt(1, f.machine, f.end)).toBeNull();
    }
  });

  it('a trip stops the machine for its duration', () => {
    const f = first('trip');
    const during = scalarsAt(1, f.machine, f.start + 1_000);
    expect(during.running).toBe(false);
    expect(during.speed).toBe(0);
    expect(during.power).toBe(0);
    expect(rms(chunkAt(1, f.machine, 1, f.start + 1_000).values)).toBeLessThan(0.2);
    expect(scalarsAt(1, f.machine, f.end + 1_000).running).toBe(true);
  });

  it('overheating takes both temperatures past their alarm limits', () => {
    const f = first('overheat');
    const s = scalarsAt(1, f.machine, late(f));
    expect(s.exhaustTemp).toBeGreaterThan(SENSOR.exhaustTemp.alarm ?? Infinity);
    expect(s.bearingTemp).toBeGreaterThan(SENSOR.bearingTemp.alarm ?? Infinity);
  });

  it('bearing wear raises vibration past its warning limit and warms the bearing', () => {
    const f = first('bearing-wear');
    const before = chunkAt(1, f.machine, 1, f.start - 1_000);
    const after = chunkAt(1, f.machine, 1, late(f));
    expect(rms(after.values)).toBeGreaterThan(SENSOR.vib.warn ?? Infinity);
    expect(rms(after.values)).toBeGreaterThan(2 * rms(before.values));
    expect(scalarsAt(1, f.machine, late(f)).bearingTemp).toBeGreaterThan(
      SENSOR.bearingTemp.warn ?? Infinity,
    );
  });
});

describe('the feed', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('catches up on at most 4 records and drops older ones', () => {
    expect(due(10, 12)).toEqual([11, 12]);
    expect(due(10, 30)).toEqual([27, 28, 29, 30]);
    expect(due(10, 10)).toEqual([]);
  });

  it('publishes about 200 records a second for the whole plant, at any rate', () => {
    for (const rate of [1, 5]) {
      vi.useFakeTimers({ now: T });
      const counts = new Map<StreamName, number>();
      const src: Source = {
        subscribe: () => () => {},
        publish: (stream) => {
          counts.set(stream, (counts.get(stream) ?? 0) + 1);
        },
      };
      const feeds = MACHINES.map((machine) => runFeed(src, { machine, seed: 1, rateKHz: rate }));
      vi.advanceTimersByTime(10_000);
      for (const f of feeds) f.stop();
      const total = [...counts.values()].reduce((a, b) => a + b, 0);
      expect(total / 10).toBeGreaterThan(195);
      expect(total / 10).toBeLessThan(205);
      expect(counts.get('T1.vib')).toBe(200);
      expect(counts.get('T1.scalars')).toBe(50);
    }
  });

  it('publishes consecutive chunks, each starting where the last ended', () => {
    vi.useFakeTimers({ now: T });
    const t0s: number[] = [];
    const src: Source = {
      subscribe: () => () => {},
      publish: (stream, value) => {
        if (stream === 'T2.vib' && 't0' in value) t0s.push(value.t0);
      },
    };
    const f = runFeed(src, { machine: 'T2', seed: 1, rateKHz: 2 });
    vi.advanceTimersByTime(1_000);
    f.stop();
    expect(t0s.every((t, i) => i === 0 || t - (t0s[i - 1] ?? 0) === CHUNK_MS)).toBe(true);
  });
});

describe('the codec', () => {
  it('round-trips a chunk, its values as raw float32 bytes', () => {
    const c = vibChunk(1, 'T3', 5, 36_000_000_000);
    const bytes = encode(c);
    const back = decode(bytes);
    expect(back).toEqual(c);
    expect(back).toHaveProperty('values', expect.any(Float32Array));
    // 250 samples are 1,000 bytes; the rest of the record is a few dozen.
    expect(bytes.byteLength).toBeGreaterThanOrEqual(1_000);
    expect(bytes.byteLength).toBeLessThan(1_000 + 120);
  });
});
