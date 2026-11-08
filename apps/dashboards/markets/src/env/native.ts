// The widgets' environment in the native build: streams come from the
// page's store, and a chart draws on its own <canvas> on the main thread.
import { useEffect, useState, type RefObject } from 'react';
import type { Source } from '../core/streams';
import { store } from '../native/store';
import type { Build, CanvasState } from './canvas';
import { createHooks } from './hooks';

const useSource = (): Source => store;

export const { useLatest, useKeyed, useRecent, usePublish } = createHooks(useSource);

/** The build these hooks run in, for the metrics panel. */
export const BUILD: Build = 'native';

/** The canvas `ref` points at, sized to its CSS box. */
export function useCanvas(ref: RefObject<HTMLCanvasElement | null>): CanvasState {
  const [state, setState] = useState<CanvasState>({ ctx: null, width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const watch = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = 2;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      const ctx = el.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      setState({ ctx, width, height });
    });
    watch.observe(el);
    return () => {
      watch.disconnect();
    };
  }, [ref]);
  return state;
}

/** The element's size, from a ResizeObserver. */
export function useBox(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const watch = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    watch.observe(el);
    return () => {
      watch.disconnect();
    };
  }, [ref]);
  return box;
}
