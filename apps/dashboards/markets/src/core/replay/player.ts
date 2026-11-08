// Plays ticks against the clock at N× speed. Shared: the replay isolate
// publishes what it emits to trades.v1 and book.v1, and the native build puts
// it in its store.
import type { Tick } from './tick';

export interface Clock {
  now(): number;
  /** Runs `fn` after `ms`; returns a cancel function. */
  after(ms: number, fn: () => void): () => void;
}

const realClock: Clock = {
  now: () => performance.now(),
  after(ms, fn) {
    const h = setTimeout(fn, ms);
    return () => {
      clearTimeout(h);
    };
  },
};

export interface Player {
  stop(): void;
}

/**
 * Emits each tick when `t / speed` ms have passed since the start. Ticks due
 * in the same timer turn go out together, in order, so a slow consumer
 * catches up instead of drifting. `from` starts part-way into the recording:
 * ticks before it are skipped, and the one at `from` plays at once.
 */
export function play(
  ticks: Iterable<Tick>,
  emit: (tick: Tick) => void,
  opts: { speed?: number; clock?: Clock; from?: number } = {},
): Player {
  const speed = opts.speed ?? 1;
  const clock = opts.clock ?? realClock;
  const from = Math.max(0, opts.from ?? 0);
  const it = ticks[Symbol.iterator]();
  // Recording time `from` plays now: shift the start back by `from / speed`.
  const start = clock.now() - from / speed;
  let pending = it.next();
  while (!pending.done && pending.value.t < from) pending = it.next();
  let cancel: (() => void) | undefined;
  const state = { stopped: false };

  const turn = (): void => {
    const elapsed = (clock.now() - start) * speed;
    while (!pending.done && pending.value.t <= elapsed) {
      emit(pending.value);
      if (state.stopped) return;
      pending = it.next();
    }
    if (pending.done) return;
    cancel = clock.after(Math.max(0, pending.value.t / speed - (clock.now() - start)), turn);
  };
  turn();

  return {
    stop() {
      state.stopped = true;
      cancel?.();
    },
  };
}
