/** @jsxImportSource preact */
import type { VNode } from 'preact';

export interface HeadProps {
  /** The page's own title; " · Isoloop" is added unless it's the home page. */
  title: string;
  description: string;
  /** The page's path on the site, e.g. `/how-it-works/`, for the canonical and og:url. */
  path: string;
  /** The site's origin. */
  origin?: string;
  /** A 1200×630 preview image, root-absolute; none until the design pick (ADR 0002, decision 9). */
  image?: string;
  /** The page's CSP (ADR 0002, decision 8). Left out in dev, where Vite injects inline styles. */
  csp?: string;
  home?: boolean;
}

/**
 * Everything a page's <head> holds besides the CSS and theme.js that ui/vite
 * injects: charset, viewport, the CSP meta, the title, and the description and
 * link-preview tags (ADR 0002, decision 9). Rendered to static HTML at build
 * time, like every component.
 */
export function Head({
  title,
  description,
  path,
  origin = 'https://isoloop.dev',
  image,
  csp,
  home = false,
}: HeadProps): VNode {
  const full = home ? title : `${title} · Isoloop`;
  const url = origin + path;
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {csp ? <meta http-equiv="Content-Security-Policy" content={csp} /> : null}
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Isoloop" />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image ? <meta property="og:image" content={origin + image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={origin + image} /> : null}
    </>
  );
}
