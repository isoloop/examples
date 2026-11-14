/** @jsxImportSource preact */
import type { VNode } from 'preact';

export interface FrameProps {
  /** Same-origin, root-absolute: the site's CSP allows nothing else. */
  src: string;
  /** The iframe's accessible name. */
  title: string;
  /** Height in CSS pixels; the width follows the container. */
  height: number;
  /** A link to open the framed page on its own. */
  open?: { href: string; label: string };
}

/**
 * What a framed page of our own may do: run its scripts and workers as its own
 * origin (localStorage, so the theme follows the site's), open links in a new
 * tab or the whole window on a click, and download (the diagrams' exports).
 */
const SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox ' +
  'allow-top-navigation-by-user-activation allow-downloads';

/**
 * A lazy iframe for a same-origin page: basic on the landing page, the
 * diagrams on "how it works" (ADR 0002, decisions 4 and 6).
 */
export function Frame({ src, title, height, open }: FrameProps): VNode {
  return (
    <figure class="ui-frame">
      <iframe src={src} title={title} loading="lazy" height={height} sandbox={SANDBOX} />
      {open ? (
        <figcaption>
          <a href={open.href}>{open.label}</a>
        </figcaption>
      ) : null}
    </figure>
  );
}
