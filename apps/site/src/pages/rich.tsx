/** @jsxImportSource preact */
import type { VNode } from 'preact';

/** Copy text with `backticks` set as code; everything else as plain text. */
export function rich(text: string): (string | VNode)[] {
  return text
    .split('`')
    .map((part, i) => (i % 2 === 1 ? <code key={`${String(i)}:${part}`}>{part}</code> : part));
}
