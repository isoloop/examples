/** @jsxImportSource preact */
import type { VNode } from 'preact';

/**
 * The thin bar on the dashboards (ADR 0003, decision 7): a way back to the
 * site. Fixed dark by its own data-theme, to match the dark-only dashboards,
 * with no toggle and no theme script.
 */
export function Bar(): VNode {
  return (
    <nav class="ui-bar" data-theme="dark" aria-label="Isoloop">
      <a href="/">← Isoloop</a>
      <a href="/how-it-works/">How it works</a>
      <a href="/examples/">Examples</a>
    </nav>
  );
}
