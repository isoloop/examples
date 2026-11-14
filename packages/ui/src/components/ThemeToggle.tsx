/** @jsxImportSource preact */
import type { VNode } from 'preact';

/**
 * The theme switch (ADR 0003, as amended): a sun and a moon in a pill, and a
 * knob that slides behind the active one. A real switch, named "Dark theme",
 * checked in dark mode. theme.js un-hides and wires it; without JS it stays
 * hidden and the system setting applies.
 */
export function ThemeToggle(): VNode {
  return (
    <button
      type="button"
      class="ui-toggle"
      data-ui-theme-toggle
      hidden
      role="switch"
      aria-checked="false"
      aria-label="Dark theme"
    >
      <span class="ui-toggle-knob" aria-hidden="true" />
      <svg class="ui-toggle-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg class="ui-toggle-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a6.8 6.8 0 0 0 10.6 10.6z" />
      </svg>
    </button>
  );
}
