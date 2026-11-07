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

/** A store for `useSyncExternalStore` that folds records into a snapshot. */
function useFold<S extends StreamName, T>(
  source: Source,
  stream: S,
  from: 'earliest' | 'latest',
  init: () => T,
  step: (prev: T, r: Rec<Streams[S]>) => T,
  deps: readonly unknown[],
): T {
  const store = useMemo(() => {
    let snap = init();
    return {
      subscribe: (notify: () => void) =>
        source.subscribe(
          stream,
          (r) => {
            snap = step(snap, r);
            notify();
          },
          from,
        ),
      get: () => snap,
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
        [],
      );
    },
    useKeyed: (stream) => {
      const source = useSource();
      return useFold(
        source,
        stream,
        'earliest',
        () => new Map(),
        (prev, r) => {
          const next = new Map(prev);
          next.set(r.key ?? '', r.value);
          return next;
        },
        [],
      );
    },
    useRecent: (stream, n, from = 'latest') => {
      const source = useSource();
      return useFold(
        source,
        stream,
        from,
        (): Streams[typeof stream][] => [],
        (prev, r) => {
          const next = prev.length >= n ? prev.slice(prev.length - n + 1) : prev.slice();
          next.push(r.value);
          return next;
        },
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
