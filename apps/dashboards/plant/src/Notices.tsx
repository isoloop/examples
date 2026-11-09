import { durability, onDurability } from '#host';
import { useEffect, useState } from 'react';
import { CURRENT } from './builds';
import { SETTINGS } from './url';

/**
 * What the page warns about: the `own` placement's worker count, over the
 * soft budget (decision 6), and alarms and events kept in memory where
 * persistent topics can't open (decision 5).
 */
export function Notices() {
  const [degraded, setDegraded] = useState(durability?.degraded);
  useEffect(
    () =>
      onDurability(() => {
        setDegraded(durability?.degraded);
      }),
    [],
  );
  return (
    <>
      {CURRENT === 'isoloop' && SETTINGS.placement === 'own' && (
        <p className="notice" role="note" data-notice="own">
          The <b>own</b> placement runs every isolate on its own worker: about 105 workers, over
          Isoloop's soft budget of 32. It's here to measure what that costs.
        </p>
      )}
      {degraded !== undefined && (
        <p className="notice" role="note" data-notice="memory">
          Alarms and events are kept in memory only on this page ({degraded}): they won't survive a
          reload.
        </p>
      )}
    </>
  );
}
