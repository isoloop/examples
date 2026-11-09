// The native builds' store: what a normal single-page app keeps its live data
// in. Per stream, the records its retention keeps (core/retention.ts) and,
// for keyed streams, the latest value per key; subscribers get records
// synchronously. With a `Storage`, alarms, events and the clear markers are
// kept in it, written at most once a second: the idiomatic stand-in for the
// Isoloop build's persistent topics. A data worker in the native + workers
// build keeps its own store, without storage.
import { isMachine } from './machines';
import {
  HISTORY_CAP,
  MACHINE_KEEP,
  PERSISTENT,
  PLANT_KEEP,
  isPersistent,
  timeOf,
  type Keep,
} from './retention';
import type { MachineStream, PlantStream, Rec, Source, StreamName, ValueOf } from './streams';

type AnyRec = Rec<unknown>;

export function keepOf(stream: StreamName): Keep {
  const [m, k] = stream.split('.');
  if (m !== undefined && k !== undefined && isMachine(m)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a machine stream's suffix
    return MACHINE_KEEP[k as MachineStream];
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the other streams are plant streams
  return PLANT_KEEP[stream as PlantStream];
}

const PREFIX = 'plant:';

export class Store implements Source {
  readonly #log = new Map<StreamName, AnyRec[]>();
  readonly #keyed = new Map<StreamName, Map<string, AnyRec>>();
  readonly #subs = new Map<StreamName, Set<(r: AnyRec) => void>>();
  readonly #storage: Storage | undefined;
  readonly #dirty = new Set<PlantStream>();
  #flush: ReturnType<typeof setTimeout> | undefined;

  constructor(storage?: Storage) {
    this.#storage = storage;
    for (const s of PERSISTENT) {
      const raw = storage?.getItem(`${PREFIX}${s}`);
      if (!raw) continue;
      try {
        const recs: unknown = JSON.parse(raw);
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- our own writes, below
        if (Array.isArray(recs)) for (const r of recs as AnyRec[]) this.#keep(s, r, keepOf(s));
      } catch {
        storage?.removeItem(`${PREFIX}${s}`);
      }
    }
  }

  #keep(stream: StreamName, r: AnyRec, keep: Keep): void {
    if (keep.kind === 'keyed') {
      const m = this.#keyed.get(stream) ?? new Map<string, AnyRec>();
      m.set(r.key ?? '', r);
      this.#keyed.set(stream, m);
      return;
    }
    let log = this.#log.get(stream);
    if (!log) {
      log = [];
      this.#log.set(stream, log);
    }
    log.push(r);
    if (keep.kind === 'last-n') {
      // Trim in batches, so a capped log isn't spliced on every record.
      if (log.length > keep.n + Math.max(16, keep.n / 8)) log.splice(0, log.length - keep.n);
    } else {
      const cut = timeOf(r.value) - keep.ms;
      let drop = 0;
      while (drop < log.length && timeOf(log[drop]?.value) < cut) drop++;
      // In batches too; `records` leaves out the few older ones in between.
      if (drop > 32) log.splice(0, drop);
    }
  }

  /** The records a new `earliest` subscriber replays, as the retention keeps them. */
  records(stream: StreamName): AnyRec[] {
    const keep = keepOf(stream);
    if (keep.kind === 'keyed') return [...(this.#keyed.get(stream)?.values() ?? [])];
    const log = this.#log.get(stream) ?? [];
    if (keep.kind === 'last-n') return log.length > keep.n ? log.slice(-keep.n) : log.slice();
    const last = log.at(-1);
    if (!last) return [];
    const cut = timeOf(last.value) - keep.ms;
    return log.filter((r) => timeOf(r.value) >= cut);
  }

  publish<S extends StreamName>(stream: S, value: ValueOf<S>, key?: string): void {
    const r: AnyRec = key === undefined ? { value } : { key, value };
    this.#keep(stream, r, keepOf(stream));
    if (this.#storage && isPersistent(stream)) this.#save(stream);
    for (const fn of this.#subs.get(stream) ?? []) fn(r);
  }

  subscribe<S extends StreamName>(
    stream: S,
    fn: (r: Rec<ValueOf<S>>) => void,
    from: 'earliest' | 'latest',
  ): () => void {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- records in `stream`'s slot are `ValueOf<S>`
    const cb = fn as (r: AnyRec) => void;
    if (from === 'earliest') for (const r of this.records(stream)) cb(r);
    const set = this.#subs.get(stream) ?? new Set();
    set.add(cb);
    this.#subs.set(stream, set);
    return () => {
      set.delete(cb);
    };
  }

  #save(stream: PlantStream): void {
    this.#dirty.add(stream);
    if (this.#flush !== undefined) return;
    this.#flush = setTimeout(() => {
      this.#flush = undefined;
      for (const s of this.#dirty) {
        const recs = this.records(s).slice(-HISTORY_CAP);
        try {
          this.#storage?.setItem(`${PREFIX}${s}`, JSON.stringify(recs));
        } catch {
          // Over the storage quota: the history stays in memory.
        }
      }
      this.#dirty.clear();
    }, 1_000);
  }
}
