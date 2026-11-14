// Small helpers for the vanilla isolates: elements built with the DOM calls the
// isoloop-dom subset provides, and the Block and Crash buttons every isolate has.
import type { IsolateContext } from '@isoloop/runtime';
import { activity, control } from '../topics';

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) if (c) e.append(c);
  return e;
}

/** How long Block keeps the loop busy: past the kernel's 2 s kill limit (main.ts). */
export const BLOCK_MS = 3_000;

/**
 * Block: keeps this isolate's event loop busy for 3 s. The kernel kills a
 * loop that stays busy for 2 s and restarts it; in a pool, every member
 * restarts with it.
 * Crash: reports an error as this isolate's own (`ctx.reportError`). Only
 * this isolate restarts, even in a pool. An error thrown from a timer or
 * handler would take the whole pool's worker down instead.
 */
function blockLoop(): void {
  const t = performance.now();
  while (performance.now() - t < BLOCK_MS) {
    // Busy on purpose: this isolate's loop, and its pool's if it has one.
  }
}

export function faults(ctx: IsolateContext<HTMLElement>, name: string): HTMLElement {
  const crash = (): void => {
    ctx.reportError(new Error(`${name} crashed on purpose`));
  };
  const blockButton = el('button', { 'data-fault': 'block' }, 'Block 3 s');
  blockButton.addEventListener('click', blockLoop);
  const crashButton = el('button', { 'data-fault': 'crash' }, 'Crash');
  crashButton.addEventListener('click', crash);
  // Embedded, the site's controls arrive on control.v1 and do the same.
  if (reporting(ctx)) {
    ctx.bus.subscribe(control, (r) => {
      if (r.value.to !== name) return;
      if (r.value.act === 'block') blockLoop();
      else crash();
    });
  }
  return el('div', { class: 'row faults' }, blockButton, crashButton);
}

/** What a report says besides how long the task took. */
export type ReportExtra = { kind?: 'task' | 'read' | 'rejected'; topic?: string; offset?: number };

/**
 * Whether basic is embedded in the site's demo (the host passes
 * `config: { report: true }`). Only then do the isolates publish activity.v1
 * and run on their own, so the recording has something to draw.
 */
export function reporting(ctx: IsolateContext<HTMLElement>): boolean {
  const c = ctx.config;
  return typeof c === 'object' && c !== null && Reflect.get(c, 'report') === true;
}

/**
 * Runs `task`, then, when reporting, publishes how long it took to activity.v1.
 * The publish is real bus traffic: a blocked isolate publishes nothing, which
 * is the gap the recording shows.
 */
export function reporter(
  ctx: IsolateContext<HTMLElement>,
): (task: () => void, extra?: ReportExtra) => void {
  const on = reporting(ctx);
  return (task, extra = {}) => {
    const t = performance.now();
    task();
    if (!on) return;
    const ms = Math.round((performance.now() - t) * 100) / 100;
    void ctx.bus.publish(activity, { value: { ms, ...extra } }).catch(() => undefined);
  };
}
