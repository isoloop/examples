import { useEffect, useRef } from 'react';
import { kernel } from '../isoloop/kernel';
import { ISOLATES, srcOf } from '#widgets';
import type { WidgetName } from '../widgets';

/** A slot in the Isoloop build: a surface the widget's isolate renders into. */
export function Slot({ name }: { name: WidgetName }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const surface = ref.current;
    if (!surface) return undefined;
    const { grants } = ISOLATES[name];
    let stopped = false;
    let stop: (() => Promise<void>) | undefined;
    void srcOf(name).then((src) => {
      if (stopped) return;
      const handle = kernel.spawn({ id: name, src, surface, grants });
      stop = () => handle.stop();
    });
    return () => {
      stopped = true;
      void stop?.();
    };
  }, [name]);
  return <div ref={ref} className="slot" data-slot={name} />;
}
