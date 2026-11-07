import type { Book, Trade } from '../schemas';

/**
 * One recorded or synthesized event, `t` ms after the recording starts. The
 * format for recordings (`scripts/record.ts` writes it as JSON lines) and for
 * the synthesizer.
 */
export type Tick =
  | { t: number; kind: 'trade'; rec: Trade }
  | { t: number; kind: 'book'; rec: Book };
