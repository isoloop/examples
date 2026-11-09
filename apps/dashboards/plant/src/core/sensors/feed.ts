// A machine's feed (M3d task 2): the generator on a clock, publishing each
// vibration chunk as it completes and each row of slow signals. On Isoloop it
// is a headless feed isolate; on native it runs on the main thread, and on
// native + workers in the machine's data worker.
//
// A feed that falls behind (its thread was busy) catches up on at most
// `CATCH_UP` records of each kind and drops older ones, as a live source
// would: a stall leaves a gap in the data, which the comparison measures.
import type { MachineId } from '../machines';
import { of, type Source, type Stoppable } from '../streams';
import { CHUNK_MS, SCALARS_MS, scalarsAt, vibChunk } from './signals';

export interface FeedConfig {
  machine: MachineId;
  seed: number;
  rateKHz: number;
}

const CATCH_UP = 4;

/** Indexes due after `last` up to `now`, at most `CATCH_UP` of them. */
export function due(last: number, now: number): number[] {
  const from = Math.max(last + 1, now - CATCH_UP + 1);
  const out: number[] = [];
  for (let i = from; i <= now; i++) out.push(i);
  return out;
}

export function runFeed(src: Source, c: FeedConfig, clock = () => Date.now()): Stoppable {
  const vib = of(c.machine, 'vib');
  const scalars = of(c.machine, 'scalars');
  // The last complete chunk and row: the one that ended at or before now.
  let lastChunk = Math.floor(clock() / CHUNK_MS) - 1;
  let lastRow = Math.floor(clock() / SCALARS_MS) - 1;
  const tick = (): void => {
    const now = clock();
    const chunk = Math.floor(now / CHUNK_MS) - 1;
    for (const i of due(lastChunk, chunk)) {
      src.publish(vib, vibChunk(c.seed, c.machine, c.rateKHz, i));
    }
    lastChunk = Math.max(lastChunk, chunk);
    const row = Math.floor(now / SCALARS_MS) - 1;
    for (const i of due(lastRow, row)) {
      src.publish(scalars, scalarsAt(c.seed, c.machine, i * SCALARS_MS));
    }
    lastRow = Math.max(lastRow, row);
  };
  const id = setInterval(tick, CHUNK_MS / 2);
  return {
    stop: () => {
      clearInterval(id);
    },
  };
}
