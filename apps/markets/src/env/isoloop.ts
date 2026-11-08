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
  const { config } = useIsolate();
  const diag = String(Reflect.get((config as object | null) ?? {}, 'diag') ?? '');
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
    if (diag.includes('nopresent')) {
      // DIAG: draw in the worker on a canvas the page never shows.
      off = new OffscreenCanvas(1, 1);
      size = { width: 300, height: 150 };
      apply();
      return undefined;
    }
    el.addEventListener('resize', onResize);
    void host.requestCanvas(el).then((c) => {
      off = c;
      apply();
    });
    return () => {
      el.removeEventListener('resize', onResize);
    };
  }, [host, ref, diag]);
  return state;
}

/**
 * The element's size, from the host's `measure` once it's rendered, and again
 * when the page resizes (a surface's box changes with the page's layout).
 */
export function useBox(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
  const host = useHost();
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let live = true;
    const read = (): void => {
      void host.measure(el).then((r) => {
        if (live) setBox({ width: r.width, height: r.height });
      });
    };
    read();
    const timer = setInterval(read, 1_000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [host, ref]);
  return box;
}
