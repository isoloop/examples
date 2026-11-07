// The widgets' data hooks, over whichever `Source` the build provides. Plain
// React and no Isoloop imports: env/isoloop.ts and env/native.ts each call
// `createHooks` with their source, and a Vite alias (`#env`) picks one.
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Rec, Source, StreamName, Streams } from '../core/streams';

export interface Hooks {
  /** The latest record's value, or undefined until one arrives. */
  useLatest: <S extends StreamName>(
    stream: S,
    from?: 'earliest' | 'latest',
  ) => Streams[S] | undefined;
  /** A compacted stream's current value per key, replayed from the start. */
  useKeyed: <S extends StreamName>(stream: S) => ReadonlyMap<string, Streams[S]>;
  /** The last `n` values, oldest first. */
  useRecent: <S extends StreamName>(
    stream: S,
    n: number,
    from?: 'earliest' | 'latest',
  ) => readonly Streams[S][];
  usePublish: <S extends StreamName>(stream: S) => (value: Streams[S], key?: string) => void;
}

/**
 * Runs `fn` at most once per frame: `requestAnimationFrame` where the scope has
 * it (the main thread, workers in Chromium and Firefox), a 16 ms timer where it
 * doesn't. A feed can deliver thousands of records a second; widgets render the
 * latest state once a frame, as any app on a fast feed would.
 */
export function perFrame(fn: () => void): { request: () => void; cancel: () => void } {
  const raf = typeof requestAnimationFrame === 'function';
  let cancelPending: (() => void) | undefined;
  const run = (): void => {
    cancelPending = undefined;
    fn();
  };
  return {
    request: () => {
      if (cancelPending) return;
      if (raf) {
        const id = requestAnimationFrame(run);
        cancelPending = () => {
          cancelAnimationFrame(id);
        };
      } else {
        const id = setTimeout(run, 16);
        cancelPending = () => {
          clearTimeout(id);
        };
      }
    },
    cancel: () => {
      cancelPending?.();
      cancelPending = undefined;
    },
  };
}

/**
 * A store for `useSyncExternalStore` that folds records into a state, and
 * hands React a snapshot of it at most once per frame. `snapshot` turns the
 * state into what the widget sees; it runs only when React reads after a change.
 */
function useFold<S extends StreamName, State, T>(
  source: Source,
  stream: S,
  from: 'earliest' | 'latest',
  init: () => State,
  step: (state: State, r: Rec<Streams[S]>) => State,
  snapshot: (state: State) => T,
  deps: readonly unknown[],
): T {
  const store = useMemo(() => {
    let state = init();
    let snap = snapshot(state);
    let dirty = false;
    return {
      subscribe: (notify: () => void) => {
        const frame = perFrame(notify);
        const off = source.subscribe(
          stream,
          (r) => {
            state = step(state, r);
            dirty = true;
            frame.request();
          },
          from,
        );
        return () => {
          frame.cancel();
          off();
        };
      },
      get: () => {
        if (dirty) {
          snap = snapshot(state);
          dirty = false;
        }
        return snap;
      },
    };
  }, [source, stream, from, ...deps]);
  return useSyncExternalStore(store.subscribe, store.get);
}

export function createHooks(useSource: () => Source): Hooks {
  return {
    useLatest: (stream, from = 'latest') => {
      const source = useSource();
      return useFold(
        source,
        stream,
        from,
        (): Streams[typeof stream] | undefined => undefined,
        (_p, r): Streams[typeof stream] | undefined => r.value,
        (v) => v,
        [],
      );
    },
    useKeyed: (stream) => {
      const source = useSource();
      return useFold(
        source,
        stream,
        'earliest',
        () => new Map<string, Streams[typeof stream]>(),
        (map, r) => map.set(r.key ?? '', r.value),
        (map): ReadonlyMap<string, Streams[typeof stream]> => new Map(map),
        [],
      );
    },
    useRecent: (stream, n, from = 'latest') => {
      const source = useSource();
      return useFold(
        source,
        stream,
        from,
        () => ring<Streams[typeof stream]>(n),
        (buf, r) => buf.push(r.value),
        (buf): readonly Streams[typeof stream][] => buf.toArray(),
        [n],
      );
    },
    usePublish: (stream) => {
      const source = useSource();
      return useCallback(
        (value, key) => {
          source.publish(stream, value, key);
        },
        [source, stream],
      );
    },
  };
}

export interface Ring<T> {
  push: (v: T) => Ring<T>;
  toArray: () => T[];
}

/** The last `n` values, oldest first, without copying on every push. */
export function ring<T>(n: number): Ring<T> {
  const items: T[] = [];
  let head = 0;
  const self: Ring<T> = {
    push: (v: T) => {
      if (items.length < n) items.push(v);
      else {
        items[head] = v;
        head = (head + 1) % n;
      }
      return self;
    },
    toArray: () => (head === 0 ? items.slice() : [...items.slice(head), ...items.slice(0, head)]),
  };
  return self;
}
