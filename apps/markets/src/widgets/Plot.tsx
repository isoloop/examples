import { useCanvas } from '#env';
import { useEffect, useRef, useState } from 'react';
import type { Ctx2D } from '../env/canvas';

/**
 * A canvas the widget draws on with `draw`; the context comes from the build
 * (#env). `draw` returns a short description of what it drew (null while it
 * waits for data), kept on the canvas as `data-drawn` for tests.
 */
export function Plot({
  draw,
}: {
  draw: (ctx: Ctx2D, width: number, height: number) => string | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { ctx, width, height } = useCanvas(ref);
  const [drawn, setDrawn] = useState<string | null>(null);
  useEffect(() => {
    if (ctx) setDrawn(draw(ctx, width, height));
  }, [ctx, width, height, draw]);
  return <canvas ref={ref} className="chart" data-drawn={drawn ?? undefined} />;
}
