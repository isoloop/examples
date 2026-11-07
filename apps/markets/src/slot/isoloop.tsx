import { useEffect, useRef } from 'react';
import { kernel } from '../isoloop/kernel';
import { ISOLATES } from '../isoloop/widgets';
import type { WidgetName } from '../widgets';

/** A slot in the Isoloop build: a surface the widget's isolate renders into. */
export function Slot({ name }: { name: WidgetName }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const surface = ref.current;
    if (!surface) return undefined;
    const { src, grants } = ISOLATES[name];
    const handle = kernel.spawn({ id: name, src, surface, grants });
    return () => {
      void handle.stop();
    };
  }, [name]);
  return <div ref={ref} className="slot" data-slot={name} />;
}
