/** A 2D context, on the main thread or on an `OffscreenCanvas` in a worker. */
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** What `useCanvas` gives a chart: a context to draw on and its CSS size. */
export interface CanvasState {
  ctx: Ctx2D | null;
  width: number;
  height: number;
}

/** Which build the widgets run in. */
export type Build = 'isoloop' | 'native';
