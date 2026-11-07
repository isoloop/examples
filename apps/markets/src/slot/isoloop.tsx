import { useEffect, useRef } from 'react';
import { kernel } from '../isoloop/kernel';
import { ISOLATES, srcOf } from '#widgets';
import type { Placement } from '../sizes/sizes';

/** A slot in the Isoloop build: a surface the widget's isolate renders into. */
export function Slot({ placement }: { placement: Placement }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id, widget, config } = placement;
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
  return <div ref={ref} className="slot" data-slot={id} data-widget={widget} />;
}
