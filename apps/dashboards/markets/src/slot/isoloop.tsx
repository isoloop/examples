import { useEffect, useRef, useState } from 'react';
import { kernel } from '../isoloop/kernel';
import { FRAMEWORK, ISOLATES, srcOf } from '#widgets';
import type { Placement } from '../sizes/sizes';
import { Head } from './Head';

/** Workers numbered in the order the page starts them, for the headers. */
let started = 0;
const LABEL = { react: 'React', preact: 'Preact' } as const;

/** A slot in the Isoloop build: a surface the widget's isolate renders into. */
export function Slot({ placement }: { placement: Placement }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id, widget, config } = placement;
  const [worker] = useState(() => ++started);
  const framework = FRAMEWORK?.[widget];
  const where = `worker ${worker}${framework ? ` · ${LABEL[framework]}` : ''}`;
  useEffect(() => {
    const surface = ref.current;
    if (!surface) return undefined;
    const { grants } = ISOLATES[widget];
    let stopped = false;
    let stop: (() => Promise<void>) | undefined;
    void srcOf(widget).then((src) => {
      if (stopped) return;
      const handle = kernel.spawn({
        id,
        src,
        surface,
        grants,
        ...(config === undefined ? {} : { config }),
      });
      stop = () => handle.stop();
    });
    return () => {
      stopped = true;
      void stop?.();
    };
  }, [id, widget, config]);
  return (
    <div className="slot" data-slot={id} data-widget={widget}>
      <Head slot={id} where={where} />
      <div ref={ref} className="widget-body" />
    </div>
  );
}
