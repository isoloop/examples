/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { ThemeToggle } from './ThemeToggle.tsx';

/** The site's sections, for `aria-current`. */
export type Current = 'home' | 'how-it-works' | 'examples';

const LINKS: { id: Current | 'github'; href: string; label: string }[] = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'how-it-works', href: '/how-it-works/', label: 'How it works' },
  { id: 'examples', href: '/examples/', label: 'Examples' },
  { id: 'github', href: 'https://github.com/isoloop/isoloop', label: 'GitHub' },
];

/**
 * The full header (ADR 0003, decision 7): the wordmark, the site nav and the
 * theme toggle. Links are root-absolute: everything is served from the root of
 * isoloop.dev. Until the logo exists, the wordmark is the text "Isoloop".
 */
export function Header({ current }: { current?: Current }): VNode {
  return (
    <header class="ui-header">
      <a class="ui-wordmark" href="/">
        Isoloop
      </a>
      <nav class="ui-nav" aria-label="Site">
        {LINKS.map((l) => (
          <a key={l.id} href={l.href} aria-current={l.id === current ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  );
}
