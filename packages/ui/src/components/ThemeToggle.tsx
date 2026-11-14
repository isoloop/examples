/** @jsxImportSource preact */
import type { VNode } from 'preact';

/**
 * A plain button that theme.js un-hides and wires: pressed means dark. Hidden
 * without JS, when the system setting applies (ADR 0003, decision 4).
 */
export function ThemeToggle(): VNode {
  return (
    <button type="button" class="ui-toggle" data-ui-theme-toggle hidden aria-pressed="false">
      Dark theme
    </button>
  );
}
