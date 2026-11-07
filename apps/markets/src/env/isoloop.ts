// The widgets' environment inside an isolate: streams are bus topics, and a
// chart's canvas is handed over by the host as an OffscreenCanvas
// (`requestCanvas`), drawn on from the worker.
import { useHost, useIsolate } from '@isoloop/react';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { Source } from '../core/streams';
import { busSource } from '../isoloop/source';
import type { Build, CanvasState } from './canvas';
import { createHooks } from './hooks';

function useSource(): Source {
  const { bus } = useIsolate();
  return useMemo(() => busSource(bus), [bus]);
}

export const { useLatest, useKeyed, useRecent, usePublish } = createHooks(useSource);

/** The build these hooks run in, for the metrics panel. */
export const BUILD: Build = 'isoloop';

/** The canvas `ref` points at, as an OffscreenCanvas from the host, sized to its CSS box. */
export function useCanvas(ref: RefObject<HTMLCanvasElement | null>): CanvasState {
  const host = useHost();
  const [state, setState] = useState<CanvasState>({ ctx: null, width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let off: OffscreenCanvas | undefined;
    let size = { width: 0, height: 0 };
    const apply = (): void => {
      if (!off || size.width === 0) return;
      const dpr = 2;
      off.width = Math.round(size.width * dpr);
      off.height = Math.round(size.height * dpr);
      const ctx = off.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      setState({ ctx, ...size });
    };
    const onResize = (e: Event): void => {
      const w: unknown = Reflect.get(e, 'width');
      const h: unknown = Reflect.get(e, 'height');
      if (typeof w === 'number' && typeof h === 'number') {
        size = { width: w, height: h };
        apply();
      }
    };
    el.addEventListener('resize', onResize);
    void host.requestCanvas(el).then((c) => {
      off = c;
      apply();
    });
    return () => {
      el.removeEventListener('resize', onResize);
    };
  }, [host, ref]);
  return state;
}
