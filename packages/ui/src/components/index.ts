// The shared components (ADR 0003, decision 2): Preact, rendered to static
// HTML at build time through render(); no component code reaches a page.
export { Bar } from './Bar.tsx';
export { Footer } from './Footer.tsx';
export { Header, type Current } from './Header.tsx';
export { ThemeToggle } from './ThemeToggle.tsx';
