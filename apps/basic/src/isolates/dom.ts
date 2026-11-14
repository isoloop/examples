// Small helpers for the vanilla isolates: elements built with the DOM calls the
// isoloop-dom subset provides, and the Block and Crash buttons every isolate has.
import type { IsolateContext } from '@isoloop/runtime';

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
export function faults(ctx: IsolateContext<HTMLElement>, name: string): HTMLElement {
  const block = el('button', { 'data-fault': 'block' }, 'Block 3 s');
  block.addEventListener('click', () => {
    const t = performance.now();
    while (performance.now() - t < BLOCK_MS) {
      // Busy on purpose: this isolate's loop, and its pool's if it has one.
    }
  });
  const crash = el('button', { 'data-fault': 'crash' }, 'Crash');
  crash.addEventListener('click', () => {
    ctx.reportError(new Error(`${name} crashed on purpose`));
  });
  return el('div', { class: 'row faults' }, block, crash);
}
