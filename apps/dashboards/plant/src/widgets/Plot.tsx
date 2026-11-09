import { useCanvas } from '#env';
import { useEffect, useRef, useState } from 'react';
import type { Ctx2D } from '../env/canvas';
import { timed, useCountDraw, useRecordTime } from '../metrics/timing';

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
  const record = useRecordTime();
  const counted = useCountDraw();
  // At most one draw per frame: updates that arrive within a frame are drawn
  // once, with the latest data.
  const latest = useRef({ ctx, width, height, draw });
  latest.current = { ctx, width, height, draw };
  const pending = useRef(0);
  useEffect(() => {
    if (!ctx || pending.current !== 0) return;
    pending.current = requestAnimationFrame(() => {
      pending.current = 0;
      const l = latest.current;
      if (!l.ctx) return;
      counted();
      setDrawn(timed(record, () => l.draw(l.ctx!, l.width, l.height)));
    });
  }, [ctx, width, height, draw, record, counted]);
  useEffect(
    () => () => {
      cancelAnimationFrame(pending.current);
    },
    [],
  );
  return <canvas ref={ref} className="chart" data-drawn={drawn ?? undefined} />;
}
