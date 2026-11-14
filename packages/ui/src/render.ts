// The one place that turns components into HTML (ADR 0003, decision 2). Every
// page and partial goes through `render()`, so swapping the renderer changes
// this file only; render.test.ts is the conformance suite a swap must pass.
import type { VNode } from 'preact';
import { renderToStaticMarkup } from 'preact-render-to-string';

/** Static HTML for a Preact tree: no hydration markers, every string escaped. */
export function render<P>(node: VNode<P>): string {
  return renderToStaticMarkup(node);
}
