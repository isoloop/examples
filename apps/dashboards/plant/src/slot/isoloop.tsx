import { useEffect, useRef, useState } from 'react';
import { ISOLATES } from '../isoloop/widgets';
import { kernel } from '../isoloop/kernel';
import { poolOf, whereOf } from '../isoloop/placement';
import { SETTINGS } from '../url';
import { CATEGORY, type Placed } from '../widgets/catalog';
import { Head } from './Head';

/** Own workers numbered in the order the page starts them, for the headers. */
let started = 0;

/** A slot in the Isoloop build: a surface the widget's isolate renders into. */
export function Slot({ placed }: { placed: Placed }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id, widget, machine } = placed;
  const pool = poolOf(SETTINGS.placement, { kind: 'widget', ...(machine ? { machine } : {}) });
  const [worker] = useState(() => (pool === undefined ? ++started : 0));
  useEffect(() => {
    const surface = ref.current;
    const isolate = ISOLATES[widget];
    if (!surface || !isolate) return undefined;
    const handle = kernel.spawn({
      id,
      src: isolate.src,
      surface,
      grants: isolate.grants(machine),
      config: { slot: id, ...(machine ? { machine } : {}) },
      ...(pool === undefined ? {} : { pool }),
    });
    return () => {
      void handle.stop();
    };
  }, [id, widget, machine, pool]);
  return (
    <div className="slot" data-slot={id} data-widget={widget} data-pool={pool}>
      <Head slot={id} title={CATEGORY[widget].title} where={whereOf(pool, worker)} />
      <div ref={ref} className="widget-body" />
    </div>
  );
}
