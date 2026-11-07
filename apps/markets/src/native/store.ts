// The native build's store: what a normal single-page app keeps its live data
// in. Per stream, the last records and, for keyed streams, the latest value
// per key; subscribers get records synchronously. Alert rules and alerts go
// to localStorage, the idiomatic stand-in for the Isoloop build's persistent
// topics.
import type { Rec, Source, StreamName, Streams } from '../core/streams';

const KEEP: Record<StreamName, number> = {
  trades: 20_000, // as trades.v1's retention
  book: 200,
  prices: 0,
  aggregates: 2_000,
  alertRules: 0,
  alerts: 500,
  filters: 0,
  noise: 100,
};
const KEYED: ReadonlySet<StreamName> = new Set(['prices', 'alertRules', 'filters']);
const PERSIST: ReadonlySet<StreamName> = new Set(['alertRules', 'alerts']);

type AnyRec = Rec<Streams[StreamName]>;

export class Store implements Source {
  readonly #log = new Map<StreamName, AnyRec[]>();
  readonly #keyed = new Map<StreamName, Map<string, AnyRec>>();
  readonly #subs = new Map<StreamName, Set<(r: AnyRec) => void>>();
  readonly #storage: Storage | undefined;

  constructor(storage?: Storage) {
    this.#storage = storage;
    for (const s of PERSIST) {
      const raw = storage?.getItem(`markets:${s}`);
      if (!raw) continue;
      try {
        const recs: unknown = JSON.parse(raw);
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- our own writes, below
        if (Array.isArray(recs)) for (const r of recs as AnyRec[]) this.#keep(s, r);
      } catch {
        storage?.removeItem(`markets:${s}`);
      }
    }
  }

  #keep(stream: StreamName, r: AnyRec): void {
    if (KEYED.has(stream)) {
      const m = this.#keyed.get(stream) ?? new Map<string, AnyRec>();
      m.set(r.key ?? '', r);
      this.#keyed.set(stream, m);
      return;
    }
    const log = this.#log.get(stream) ?? [];
    log.push(r);
    if (log.length > KEEP[stream]) log.splice(0, log.length - KEEP[stream]);
    this.#log.set(stream, log);
  }

  #records(stream: StreamName): AnyRec[] {
    return KEYED.has(stream)
      ? [...(this.#keyed.get(stream)?.values() ?? [])]
      : (this.#log.get(stream) ?? []);
  }

  publish<S extends StreamName>(stream: S, value: Streams[S], key?: string): void {
    const r: AnyRec = key === undefined ? { value } : { key, value };
    this.#keep(stream, r);
    if (PERSIST.has(stream)) {
      this.#storage?.setItem(`markets:${stream}`, JSON.stringify(this.#records(stream)));
    }
    for (const fn of this.#subs.get(stream) ?? []) fn(r);
  }

  subscribe<S extends StreamName>(
    stream: S,
    fn: (r: Rec<Streams[S]>) => void,
    from: 'earliest' | 'latest',
  ): () => void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- records in `stream`'s slot are `Streams[S]`
    const cb = fn as (r: AnyRec) => void;
    if (from === 'earliest') for (const r of this.#records(stream)) cb(r);
    const set = this.#subs.get(stream) ?? new Set();
    set.add(cb);
    this.#subs.set(stream, set);
    return () => {
      set.delete(cb);
    };
  }
}

/** The page's one store. */
export const store = new Store(typeof localStorage === 'undefined' ? undefined : localStorage);
