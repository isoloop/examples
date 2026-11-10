// Each thread's timings, gathered once a second into one `timings` record:
// one message per worker (or page) instead of one per widget and engine.
// Pool members share the worker's global object (engine constraint 4 in the
// Isoloop repo), so the default batch lives there: one per pool, own worker or
// page, whichever build runs the code.
import type { Timing, Timings } from './schemas';

/** A widget's or engine's figures for the last second; called once a second, it resets them. */
export type Collect = () => Omit<Timing, 'ts' | 'slot'>;
type Publish = (value: Timings) => void;
interface Entry {
  collect: Collect;
  publish: Publish;
}

export const FLUSH_MS = 1_000;

export interface TimingBatch {
  /**
   * Adds `slot` to the batch until the returned function is called. A slot
   * reported again (a restarted widget) replaces the old entry.
   */
  report(slot: string, collect: Collect, publish: Publish): () => void;
  /** Publishes every slot's figures as one record, through the first entry that can. */
  flush(now?: number): void;
  readonly size: number;
}

export function createTimingBatch(
  every = FLUSH_MS,
  timers: Pick<typeof globalThis, 'setInterval' | 'clearInterval'> = globalThis,
): TimingBatch {
  const entries = new Map<string, Entry>();
  let timer: ReturnType<typeof setInterval> | undefined;
  const self: TimingBatch = {
    report(slot, collect, publish) {
      const entry = { collect, publish };
      entries.set(slot, entry);
      timer ??= timers.setInterval(() => {
        self.flush();
      }, every);
      return () => {
        if (entries.get(slot) !== entry) return;
        entries.delete(slot);
        if (entries.size === 0 && timer !== undefined) {
          timers.clearInterval(timer);
          timer = undefined;
        }
      };
    },
    flush(now = Date.now()) {
      if (entries.size === 0) return;
      const items: Timing[] = [];
      for (const [slot, e] of entries) items.push(Object.assign(e.collect(), { slot, ts: now }));
      const value: Timings = { ts: now, items };
      // A member whose port is gone (it is restarting) can't publish: the next one does.
      for (const [slot, e] of entries) {
        try {
          e.publish(value);
          return;
        } catch {
          entries.delete(slot);
        }
      }
    },
    get size() {
      return entries.size;
    },
  };
  return self;
}

const KEY = Symbol.for('isoloop.plant.timings');

const isBatch = (x: unknown): x is TimingBatch =>
  typeof x === 'object' && x !== null && 'report' in x && 'flush' in x;

/** This thread's batch, shared by every widget and engine running on it. */
export function timingBatch(): TimingBatch {
  const found: unknown = Reflect.get(globalThis, KEY);
  if (isBatch(found)) return found;
  const batch = createTimingBatch();
  Reflect.set(globalThis, KEY, batch);
  return batch;
}
