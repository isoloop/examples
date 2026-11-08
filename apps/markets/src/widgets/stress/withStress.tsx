// Stress controls per widget (M3b task 14). They run in the widget's own code,
// so on Isoloop they load that widget's isolate and on native the main thread.
import { usePublish } from '#env';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FunctionComponent,
  type ReactNode,
} from 'react';
import { DrawContext, TimingContext } from '../../metrics/timing';

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
  W: (props: { config?: unknown }) => ReactNode,
): FunctionComponent<{ config?: unknown }> {
  function Stressed({ config }: { config?: unknown }) {
    const [crashed, setCrashed] = useState(false);
    const slot = slotOf(config) ?? name;
    const publish = usePublish('timings');
    // The time this widget spends rendering and drawing, published once a
    // second (M3c task 10). Measured on whichever thread runs it.
    const spent = useRef(0);
    // Renders and canvas draws in the last second, counted here, in the
    // widget's own code, so every build counts the same thing. A canvas
    // widget's header shows its draws (metrics/updates.ts).
    const renders = useRef(0);
    const rendered = useCallback(() => {
      renders.current++;
    }, []);
    const draws = useRef(0);
    const drew = useCallback(() => {
      draws.current++;
    }, []);
    const record = useCallback((ms: number) => {
      spent.current += ms;
    }, []);
    useEffect(() => {
      const id = setInterval(() => {
        publish({
          slot,
          widget: name,
          ms: spent.current,
          updates: renders.current,
          ...(draws.current > 0 ? { draws: draws.current } : {}),
          ts: Date.now(),
        });
        spent.current = 0;
        renders.current = 0;
        draws.current = 0;
      }, 1_000);
      return () => {
        clearInterval(id);
      };
    }, [publish, slot]);
    if (crashed) throw new Error(`stress: ${name} crashed`);
    return (
      <TimingContext.Provider value={record}>
        <DrawContext.Provider value={drew}>
          <Timed W={W} config={config} record={record} rendered={rendered} />
        </DrawContext.Provider>
        <StressBar
          name={name}
          onCrash={() => {
            setCrashed(true);
          }}
        />
      </TimingContext.Provider>
    );
  }
  Stressed.displayName = `Stressed(${name})`;
  return Stressed;
}

/** Renders `W` by calling it, so its render (and the work in it) is timed as this component's. */
function Timed({
  W,
  config,
  record,
  rendered,
}: {
  W: (props: { config?: unknown }) => ReactNode;
  config?: unknown;
  record: (ms: number) => void;
  rendered: () => void;
}) {
  // After each commit, not each render call, so a render React throws away isn't counted.
  useEffect(rendered);
  const t0 = performance.now();
  const out = W({ config });
  record(performance.now() - t0);
  return out;
}

function slotOf(config: unknown): string | undefined {
  const v: unknown =
    typeof config === 'object' && config !== null ? Reflect.get(config, 'slot') : undefined;
  return typeof v === 'string' ? v : undefined;
}
