// The Vite plugin (ADR 0003, decisions 1 and 9): puts the shared look into an
// app's pages at build time, the way shared/browser-check.ts puts in the
// browser notice.
//
// - CSS: tokens.css, base.css (full-header pages only) and shell.css, emitted
//   as one hashed file and linked from <head>.
// - theme.js: emitted as a hashed classic script in <head>, so it runs before
//   first paint (ADR 0002, decision 8).
// - The header, bar and footer: components rendered to static HTML through
//   render(), placed where the page has a `<!-- ui:header -->` (`ui:bar`,
//   `ui:footer`) comment, else first in <body> (last, for the footer).
// - The favicon, once packages/ui/brand/favicon.svg exists (plan task 7a).
// Every file is same-origin and nothing is inline, so pages work under
// `default-src 'self'`. The dev server serves the same files.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { h } from 'preact';
import type { Plugin } from 'vite';
import { Bar, Footer, Header, type Current } from './components/index.ts';
import { render } from './render.ts';

export interface UiOptions {
  /** The full header (site, hub, basic); `current` marks the section. Also adds base.css and theme.js. */
  header?: boolean | { current?: Current };
  /** The thin, fixed-dark bar (dashboards). No base.css, no theme.js. */
  bar?: boolean;
  /** The footer. */
  footer?: boolean;
}

interface Asset {
  fileName: string;
  source: string;
  type: string;
}

const file = (name: string): URL => new URL(name, import.meta.url);
const read = (name: string): string => readFileSync(file(name), 'utf8');
const hash = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 8);

/** The files this page set needs, with content-hashed names under assets/. */
export function uiAssets(opts: UiOptions): {
  css: Asset;
  theme: Asset | undefined;
  favicon: Asset | undefined;
} {
  const full = Boolean(opts.header);
  const cssSource = [
    read('tokens.css'),
    ...(full ? [read('base.css')] : []),
    read('shell.css'),
  ].join('\n');
  const css = {
    fileName: `assets/ui-${hash(cssSource)}.css`,
    source: cssSource,
    type: 'text/css',
  };
  let theme: Asset | undefined;
  if (full) {
    const source = read('theme.js');
    theme = { fileName: `assets/ui-theme-${hash(source)}.js`, source, type: 'text/javascript' };
  }
  const iconUrl = file('../brand/favicon.svg');
  let favicon: Asset | undefined;
  if (existsSync(iconUrl)) {
    const source = readFileSync(iconUrl, 'utf8');
    favicon = { fileName: `assets/favicon-${hash(source)}.svg`, source, type: 'image/svg+xml' };
  }
  return { css, theme, favicon };
}

/** The partials, rendered. `current` (from a page's marker) wins over the option's. */
export function uiPartials(
  opts: UiOptions,
  section?: Current,
): Record<'header' | 'bar' | 'footer', string | null> {
  const current = section ?? (typeof opts.header === 'object' ? opts.header.current : undefined);
  return {
    header: opts.header ? render(h(Header, current ? { current } : {})) : null,
    bar: opts.bar ? render(h(Bar, {})) : null,
    footer: opts.footer ? render(h(Footer, {})) : null,
  };
}

/** How a page at `pagePath` (e.g. /how-it-works/index.html) reaches assets/ under `base`. */
export function assetPrefix(base: string, pagePath: string): string {
  if (base.startsWith('/') || /^[a-z]+:\/\//i.test(base))
    return base.endsWith('/') ? base : `${base}/`;
  const depth = pagePath.split('/').filter(Boolean).length - 1;
  return depth > 0 ? '../'.repeat(depth) : './';
}

const CURRENTS: ReadonlySet<string> = new Set<Current>(['home', 'how-it-works', 'examples']);
const isCurrent = (s: string): s is Current => CURRENTS.has(s);

/**
 * A page can name its section in the header marker, `<!-- ui:header:examples -->`,
 * for apps with several sections (the site). Returns that section and the html
 * with the plain marker.
 */
export function pageCurrent(html: string): { html: string; current: Current | undefined } {
  const m = /<!-- ui:header:([a-z-]+) -->/.exec(html);
  if (!m) return { html, current: undefined };
  const name = m[1] ?? '';
  if (!isCurrent(name)) throw new Error(`ui: unknown header section "${name}"`);
  return { html: html.replace(m[0], '<!-- ui:header -->'), current: name };
}

/** Puts each partial at its marker comment, or first (last for the footer) in <body>. */
export function placePartials(
  html: string,
  partials: Record<'header' | 'bar' | 'footer', string | null>,
): string {
  let out = html;
  for (const name of ['bar', 'header', 'footer'] as const) {
    const markup = partials[name];
    const marker = `<!-- ui:${name} -->`;
    if (markup === null) {
      out = out.replace(marker, '');
    } else if (out.includes(marker)) {
      out = out.replace(marker, markup);
    } else if (name === 'footer') {
      out = out.replace(/<\/body>/i, `${markup}</body>`);
    } else {
      out = out.replace(/<body([^>]*)>/i, `<body$1>${markup}`);
    }
  }
  return out;
}

export function ui(opts: UiOptions = {}): Plugin {
  let base = '/';
  return {
    name: 'ui',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html, ctx) {
      const { css, theme, favicon } = uiAssets(opts);
      const prefix = assetPrefix(base, ctx.path);
      const page = pageCurrent(html);
      return {
        html: placePartials(page.html, uiPartials(opts, page.current)),
        tags: [
          ...(theme
            ? [
                {
                  tag: 'script',
                  attrs: { src: prefix + theme.fileName },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          {
            tag: 'link',
            attrs: { rel: 'stylesheet', href: prefix + css.fileName },
            injectTo: 'head',
          },
          ...(favicon
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'icon', type: 'image/svg+xml', href: prefix + favicon.fileName },
                  injectTo: 'head' as const,
                },
              ]
            : []),
        ],
      };
    },
    generateBundle() {
      const { css, theme, favicon } = uiAssets(opts);
      for (const a of [css, theme, favicon])
        if (a) this.emitFile({ type: 'asset', fileName: a.fileName, source: a.source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const { css, theme, favicon } = uiAssets(opts);
        const hit = [css, theme, favicon].find((a) => a && path.endsWith(`/${a.fileName}`));
        if (!hit) {
          next();
          return;
        }
        res.setHeader('Content-Type', `${hit.type}; charset=utf-8`);
        res.end(hit.source);
      });
    },
  };
}
