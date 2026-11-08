// Time per widget and engine (M3c task 10), measured where the work runs: on
// the main thread on native, on each isolate's own thread on Isoloop. Each
// accumulates milliseconds and publishes them to `timings` once a second.
import { createContext, useContext } from 'react';
import type { Source } from '../core/streams';

/** Adds `ms` of work to the widget the caller renders in. */
export const TimingContext = createContext<(ms: number) => void>(() => {});

export const useRecordTime = (): ((ms: number) => void) => useContext(TimingContext);

/** Counts a canvas draw for the widget the caller renders in (its header's updates/s). */
export const DrawContext = createContext<() => void>(() => {});

export const useCountDraw = (): (() => void) => useContext(DrawContext);

/** Runs `fn`, adding its duration to `record`. */
export function timed<T>(record: (ms: number) => void, fn: () => T): T {
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    record(performance.now() - t0);
  }
}

/** An accumulator for one slot, published once a second while it runs. */
export function meter(
  publish: (ms: number) => void,
  everyMs = 1_000,
): { record: (ms: number) => void; stop: () => void } {
  let ms = 0;
  const id = setInterval(() => {
    publish(ms);
    ms = 0;
  }, everyMs);
  return {
    record: (d) => {
      ms += d;
    },
    stop: () => {
      clearInterval(id);
    },
  };
}

/** An engine's meter, publishing to `timings` as `engine-<name>`. */
export function engineMeter(src: Source, name: string): (ms: number) => void {
  return meter((ms) => {
    src.publish('timings', { slot: `engine-${name}`, widget: 'engine', ms, ts: Date.now() });
  }).record;
}
