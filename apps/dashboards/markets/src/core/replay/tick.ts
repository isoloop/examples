import type { Book, Trade } from '../schemas';

/**
 * One recorded or synthesized event, `t` ms after the recording starts. The
 * format for recordings (`scripts/record.ts` writes it as JSON lines) and for
 * the synthesizer.
 */
export type Tick =
  | { t: number; kind: 'trade'; rec: Trade }
  | { t: number; kind: 'book'; rec: Book };

/** The tick with its record's `ts` set to `ts`, for playing a recording now. */
export const restamp = (tick: Tick, ts: number): Tick =>
  tick.kind === 'trade'
    ? { ...tick, rec: { ...tick.rec, ts } }
    : { ...tick, rec: { ...tick.rec, ts } };
