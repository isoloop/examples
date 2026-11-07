import type { Exchange, Sym, Trade } from '../schemas';

/** What a feed's parser makes of one message. */
export type FeedEvent =
  | { kind: 'trade'; trade: Trade }
  /** Replace the symbol's book with these levels. */
  | {
      kind: 'snapshot';
      symbol: Sym;
      bids: [number, number][];
      asks: [number, number][];
      ts: number;
    }
  /** Change these levels; size 0 removes one. */
  | { kind: 'levels'; symbol: Sym; bids: [number, number][]; asks: [number, number][]; ts: number };

/** One exchange's public WebSocket: where, what to send, how to read it. */
export interface Feed {
  exchange: Exchange;
  url: string;
  /** Sent every `everyMs` while open, for exchanges that drop quiet sockets. */
  keepalive?: { everyMs: number; message: string };
  /** Messages to send once open, already serialized. */
  subscribe(symbols: readonly Sym[]): string[];
  /** Events in one message; [] for heartbeats, acks and anything unknown. */
  parse(data: unknown): FeedEvent[];
}

/** Parses JSON without throwing; null for anything that isn't. */
export function json(data: unknown): unknown {
  if (typeof data !== 'string') return null;
  try {
    const v: unknown = JSON.parse(data);
    return v;
  } catch {
    return null;
  }
}

export const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v));

export const time = (v: unknown): number => (typeof v === 'string' ? Date.parse(v) : NaN);
