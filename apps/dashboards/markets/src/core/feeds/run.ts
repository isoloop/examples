// Runs one feed: the socket, reconnects with backoff, a book per symbol, and
// quotes. Shared by the feed isolates and the native build, which differ only
// in where `sink` sends the records.
import type { Book, Quote, Sym, Trade } from '../schemas';
import { OrderBook } from './book';
import type { Feed } from './feed';

export type FeedStatus = 'connecting' | 'open' | 'closed';

export interface FeedSink {
  trade(t: Trade): void;
  book(b: Book): void;
  quote(q: Quote): void;
  status?(s: FeedStatus, detail?: string): void;
}

/** The part of `WebSocket` a feed uses, so tests can pass a fake. */
export interface SocketLike {
  send(data: string): void;
  close(): void;
  addEventListener(type: 'open' | 'close' | 'error', fn: () => void): void;
  addEventListener(type: 'message', fn: (e: { data: unknown }) => void): void;
}

export interface RunOptions {
  connect?: (url: string) => SocketLike;
  /** Book tops go out at most this often per symbol. */
  bookEveryMs?: number;
  /** Reconnect after 1 s, doubling to this. */
  maxBackoffMs?: number;
}

const ok = (n: number): boolean => Number.isFinite(n) && n > 0;

export function runFeed(
  feed: Feed,
  symbols: readonly Sym[],
  sink: FeedSink,
  o: RunOptions = {},
): { stop(): void } {
  const connect = o.connect ?? ((url: string): SocketLike => new WebSocket(url));
  const bookEvery = o.bookEveryMs ?? 250;
  const maxBackoff = o.maxBackoffMs ?? 30_000;
  const books = new Map(symbols.map((s) => [s, new OrderBook()]));
  const last = new Map<Sym, number>();
  const dirty = new Set<Sym>();
  const state = { stopped: false, backoff: 1_000 };
  let socket: SocketLike | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;

  const flush = (): void => {
    const now = Date.now();
    for (const symbol of dirty) {
      const top = books.get(symbol)?.top(20);
      if (!top) continue;
      sink.book({ exchange: feed.exchange, symbol, ...top, ts: now });
      const bid = top.bids[0]?.[0];
      const ask = top.asks[0]?.[0];
      const lastPrice =
        last.get(symbol) ?? (bid !== undefined && ask !== undefined ? (bid + ask) / 2 : undefined);
      if (bid !== undefined && ask !== undefined && lastPrice !== undefined) {
        sink.quote({ exchange: feed.exchange, symbol, last: lastPrice, bid, ask, ts: now });
      }
    }
    dirty.clear();
  };
  const timer = setInterval(flush, bookEvery);

  const open = (): void => {
    if (state.stopped) return;
    sink.status?.('connecting');
    const ws = connect(feed.url);
    socket = ws;
    ws.addEventListener('open', () => {
      state.backoff = 1_000;
      sink.status?.('open');
      for (const m of feed.subscribe(symbols)) ws.send(m);
      if (feed.keepalive) {
        const { everyMs, message } = feed.keepalive;
        clearInterval(ping);
        ping = setInterval(() => {
          ws.send(message);
        }, everyMs);
      }
    });
    ws.addEventListener('message', (e) => {
      for (const ev of feed.parse(e.data)) {
        if (ev.kind === 'trade') {
          const t = ev.trade;
          if (!ok(t.price) || !(t.size >= 0) || !Number.isFinite(t.ts)) continue;
          last.set(t.symbol, t.price);
          dirty.add(t.symbol);
          sink.trade(t);
          continue;
        }
        const b = books.get(ev.symbol);
        if (!b) continue;
        if (ev.kind === 'snapshot') b.clear();
        for (const [p, s] of ev.bids) if (ok(p)) b.set('bid', p, s);
        for (const [p, s] of ev.asks) if (ok(p)) b.set('ask', p, s);
        b.trim(25);
        dirty.add(ev.symbol);
      }
    });
    ws.addEventListener('error', () => {
      ws.close();
    });
    ws.addEventListener('close', () => {
      if (socket !== ws) return;
      socket = undefined;
      clearInterval(ping);
      sink.status?.('closed', `retry in ${state.backoff} ms`);
      if (state.stopped) return;
      retry = setTimeout(open, state.backoff);
      state.backoff = Math.min(state.backoff * 2, maxBackoff);
    });
  };
  open();

  return {
    stop() {
      state.stopped = true;
      clearInterval(timer);
      clearTimeout(retry);
      clearInterval(ping);
      socket?.close();
    },
  };
}
