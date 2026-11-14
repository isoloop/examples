/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { ThemeToggle } from './ThemeToggle.tsx';

/** The site's sections, for `aria-current`. */
export type Current = 'home' | 'features' | 'how-it-works' | 'examples';

const LINKS: { id: Current | 'github'; href: string; label: string }[] = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'features', href: '/features/', label: 'Features' },
  { id: 'how-it-works', href: '/how-it-works/', label: 'How it works' },
  { id: 'examples', href: '/examples/', label: 'Examples' },
  { id: 'github', href: 'https://github.com/isoloop/isoloop', label: 'GitHub' },
];

/**
 * The full header (ADR 0003, decision 7, as amended): sticky, the logo, the
 * site nav and the theme switch. The logo is the everyday mark (docs/brand.md)
 * beside "isoloop" set in Archivo; ui/vite passes the mark's files, light and
 * dark, and CSS shows the one for the theme. Links are root-absolute:
 * everything is served from the root of isoloop.dev.
 */
export function Header({
  current,
  mark,
}: {
  current?: Current;
  mark?: { light: string; dark: string };
}): VNode {
  return (
    <header class="ui-header">
      <a class="ui-wordmark" href="/" aria-label="Isoloop, home">
        {mark ? (
          <>
            <img class="ui-mark" data-for="light" src={mark.light} alt="" width={30} height={30} />
            <img class="ui-mark" data-for="dark" src={mark.dark} alt="" width={30} height={30} />
          </>
        ) : null}
        isoloop
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
