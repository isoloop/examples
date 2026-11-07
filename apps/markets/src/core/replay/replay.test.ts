import { describe, expect, it } from 'vitest';
import { book, trade } from '../schemas';
import { play, type Clock } from './player';
import { synth } from './synth';
import type { Tick } from './tick';

/** A clock the test moves by hand. */
function manualClock(): Clock & { advance(ms: number): void } {
  let now = 0;
  let timers: { at: number; fn: () => void; id: number }[] = [];
  let next = 0;
  return {
    now: () => now,
    after(ms, fn) {
      const id = ++next;
      timers.push({ at: now + ms, fn, id });
      return () => {
        timers = timers.filter((t) => t.id !== id);
      };
    },
    advance(ms) {
      const until = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const t = timers[0];
        if (!t || t.at > until) break;
        timers.shift();
        now = t.at;
        t.fn();
      }
      now = until;
    },
  };
}

const take = (n: number, seed = 7): Tick[] => [...synth({ seed, durationMs: 10_000 })].slice(0, n);

describe('synth', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    expect(take(200)).toEqual(take(200));
    expect(take(200, 8)).not.toEqual(take(200));
  });

  it('yields valid records in time order', () => {
    const ticks = [...synth({ seed: 3, durationMs: 5_000 })];
    expect(ticks.length).toBeGreaterThan(100);
    let t = 0;
    for (const tick of ticks) {
      expect(tick.t).toBeGreaterThanOrEqual(t);
      t = tick.t;
      const ok = tick.kind === 'trade' ? trade.safeParse(tick.rec) : book.safeParse(tick.rec);
      expect(ok.success).toBe(true);
    }
  });

  it('keeps every book uncrossed, best level first', () => {
    for (const tick of synth({ seed: 5, durationMs: 3_000 })) {
      if (tick.kind !== 'book') continue;
      const [bid] = tick.rec.bids;
      const [ask] = tick.rec.asks;
      expect(bid && ask && bid[0] < ask[0]).toBe(true);
    }
  });
});

const run = (speed: number): { order: Tick[]; at: number[] } => {
  const clock = manualClock();
  const order: Tick[] = [];
  const at: number[] = [];
  play(
    synth({ seed: 11, durationMs: 4_000 }),
    (tick) => {
      order.push(tick);
      at.push(clock.now());
    },
    { speed, clock },
  );
  clock.advance(4_000 / speed + 1);
  return { order, at };
};

describe('play', () => {
  it('publishes the same records in the same order at 1× and 10×', () => {
    const one = run(1);
    const ten = run(10);
    expect(ten.order).toEqual(one.order);
    expect(one.order.length).toBeGreaterThan(50);
  });

  it('emits each tick no earlier than t / speed', () => {
    const { order, at } = run(10);
    order.forEach((tick, i) => {
      expect(at[i]).toBeGreaterThanOrEqual(tick.t / 10);
    });
  });

  it('stops', () => {
    const clock = manualClock();
    let n = 0;
    const p = play(synth({ seed: 1 }), () => n++, { clock });
    clock.advance(1_000);
    p.stop();
    const seen = n;
    clock.advance(10_000);
    expect(n).toBe(seen);
  });
});
