// Each widget's updates/s for its header (as in the markets app, M3c task 9b): how often its output
// on screen changed in the last second. The same code in every build:
//
// - A DOM widget: animation frames, on the page's main thread, in which the
//   widget's DOM changed. On native React commits it there; on Isoloop the
//   render bridge applies the isolate's changes there. Either way it counts
//   what the page drew, at most once a frame.
// - A canvas widget: its draws (at most one a frame, see Plot), counted in the
//   widget's own code and reported once a second in `timings`. On native that
//   is the main thread; on Isoloop the isolate's thread, whose canvas the
//   browser presents without the main thread in Chromium and Firefox (WebKit
//   presents it on the main thread: docs/investigations/engine-constraints.md
//   in the Isoloop repo).
//
// A widget whose report is late (its thread is busy, or it is restarting), or
// whose DOM didn't change, shows 0.
import { buildMetrics } from '#metrics';
import { useEffect, useState } from 'react';
import { CATEGORY } from '../widgets/catalog';

/** Reports come once a second; one later than this counts as none. */
export const STALE_MS = 1_500;
const WINDOW_MS = 1_000;

const draws = new Map<string, { draws: number; at: number }>();
buildMetrics.timings((t) => {
  if (t.draws !== undefined) draws.set(t.slot, { draws: t.draws, at: performance.now() });
});

/** Per DOM-widget slot: whether its DOM changed since the last frame, and the frames it did. */
interface Watch {
  dirty: boolean;
  frames: number[];
}
const watches = new Map<string, Watch>();
let ticking = false;

function tick(now: number): void {
  for (const w of watches.values()) {
    if (w.dirty) {
      w.dirty = false;
      w.frames.push(now);
    }
    while (w.frames.length > 0 && (w.frames[0] ?? 0) < now - WINDOW_MS) w.frames.shift();
  }
  requestAnimationFrame(tick);
}

/** Watches the slot's body, and the surface's shadow root inside it once there is one. */
function watch(slot: string, body: Element): Watch {
  const existing = watches.get(slot);
  if (existing) return existing;
  const w: Watch = { dirty: false, frames: [] };
  watches.set(slot, w);
  const mark = (): void => {
    w.dirty = true;
  };
  const opts = { subtree: true, childList: true, characterData: true, attributes: true };
  const observer = new MutationObserver((records) => {
    mark();
    for (const r of records)
      for (const n of r.addedNodes)
        if (n instanceof Element && n.shadowRoot) observer.observe(n.shadowRoot, opts);
  });
  observer.observe(body, opts);
  for (const el of body.querySelectorAll('*'))
    if (el.shadowRoot) observer.observe(el.shadowRoot, opts);
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
  return w;
}

function outputOf(slot: string): { output: 'canvas' | 'dom'; body: Element | null } {
  const el = document.querySelector(`[data-slot="${CSS.escape(slot)}"]`);
  const widget = el?.getAttribute('data-widget');
  const category = widget
    ? Object.entries(CATEGORY).find(([name]) => name === widget)?.[1]
    : undefined;
  const output = category?.output ?? 'dom';
  return { output, body: el?.querySelector('.widget-body') ?? null };
}

/** The slot's updates in the last second, or 0 if none reached the screen; `null` before the first. */
export function updatesPerSec(slot: string): number | null {
  const { output, body } = outputOf(slot);
  if (output === 'canvas') {
    const r = draws.get(slot);
    if (!r) return null;
    return performance.now() - r.at > STALE_MS ? 0 : r.draws;
  }
  if (!body) return null;
  return watch(slot, body).frames.length;
}

export function useUpdatesPerSec(slot: string): number | null {
  const [n, setN] = useState(() => updatesPerSec(slot));
  useEffect(() => {
    const id = setInterval(() => {
      setN(updatesPerSec(slot));
    }, 250);
    return () => {
      clearInterval(id);
    };
  }, [slot]);
  return n;
}
