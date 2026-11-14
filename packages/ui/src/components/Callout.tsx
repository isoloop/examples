/** @jsxImportSource preact */
import type { ComponentChildren, VNode } from 'preact';

/** One point the reader shouldn't miss. */
export function Callout({ children }: { children?: ComponentChildren }): VNode {
  return <div class="ui-callout">{children}</div>;
}
