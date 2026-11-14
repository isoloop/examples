/** @jsxImportSource preact */
import type { VNode } from 'preact';

/** The footer: the repos, the decisions and the licence. */
export function Footer(): VNode {
  return (
    <footer class="ui-footer">
      <a href="https://github.com/isoloop/isoloop">Isoloop on GitHub</a>
      <a href="https://github.com/isoloop/isoloop/tree/main/docs/adr">Design decisions</a>
      <a href="https://github.com/isoloop/web">This site's source</a>
      <span>MIT licence</span>
    </footer>
  );
}
