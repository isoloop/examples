// Time per widget (as in the markets app, M3c task 10), measured where the
// work runs: on the main thread on native, on the isolate's thread on Isoloop.
import { createContext, useContext } from 'react';

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
