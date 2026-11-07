// Stress controls per widget (M3b task 14). They run in the widget's own code,
// so on Isoloop they load that widget's isolate and on native the main thread.
import { usePublish } from '#env';
import { useEffect, useRef, useState, type ComponentType, type FunctionComponent } from 'react';

/** How long `block` keeps the widget's loop busy. */
export const BLOCK_MS = 3_000;
/** The flood: records a second, and for how long. */
export const FLOOD_PER_S = 1_000;
export const FLOOD_MS = 5_000;

/** Busy-waits, as a long synchronous computation would. */
export function busy(ms: number): void {
  const until = performance.now() + ms;
  while (performance.now() < until) {}
}

function StressBar({ name, onCrash }: { name: string; onCrash: () => void }) {
  const publish = usePublish('noise');
  const [flooding, setFlooding] = useState(false);
  const n = useRef(0);
  useEffect(() => {
    if (!flooding) return undefined;
    // 10 records every 10 ms; timers coarser than that still average out.
    const tick = setInterval(() => {
      for (let i = 0; i < FLOOD_PER_S / 100; i++) {
        publish({ widget: name, n: n.current++, ts: Date.now() });
      }
    }, 10);
    const stop = setTimeout(() => {
      setFlooding(false);
    }, FLOOD_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [flooding, name, publish]);
  return (
    <div className="stress" aria-label={`Stress ${name}`}>
      <button
        type="button"
        name="stress-block"
        title={`Busy loop for ${BLOCK_MS / 1000} s`}
        onClick={() => {
          busy(BLOCK_MS);
        }}
      >
        block
      </button>
      <button type="button" name="stress-crash" title="Throw while rendering" onClick={onCrash}>
        crash
      </button>
      <button
        type="button"
        name="stress-flood"
        title={`Publish ${FLOOD_PER_S} records/s for ${FLOOD_MS / 1000} s`}
        aria-pressed={flooding}
        onClick={() => {
          setFlooding(true);
        }}
      >
        flood
      </button>
    </div>
  );
}

/**
 * The widget with its stress controls. `crash` throws while rendering: on
 * native the slot's error boundary catches it, on Isoloop the isolate crashes
 * and the host restarts it.
 */
/** Takes the isolate's `config` prop where there is one, so `defineIsolate` accepts it. */
export function withStress(
  name: string,
  W: ComponentType,
): FunctionComponent<{ config?: unknown }> {
  function Stressed() {
    const [crashed, setCrashed] = useState(false);
    if (crashed) throw new Error(`stress: ${name} crashed`);
    return (
      <>
        <W />
        <StressBar
          name={name}
          onCrash={() => {
            setCrashed(true);
          }}
        />
      </>
    );
  }
  Stressed.displayName = `Stressed(${name})`;
  return Stressed;
}
