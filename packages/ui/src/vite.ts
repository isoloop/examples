// The Vite plugin (ADR 0003, decisions 1 and 9): puts the shared look into an
// app's pages at build time, the way shared/browser-check.ts puts in the
// browser notice.
//
// - CSS: tokens.css, base.css (full-header pages only) and shell.css, emitted
//   as one hashed file and linked from <head>.
// - theme.js: emitted as a hashed classic script in <head>, so it runs before
//   first paint (ADR 0002, decision 8).
// - Archivo (ADR 0003, as amended): one self-hosted woff2 with its @font-face
//   at the top of the CSS and one preload, on full-header pages only. The
//   dashboards' bar keeps the system font and loads nothing.
// - The header, bar and footer: components rendered to static HTML through
//   render(), placed where the page has a `<!-- ui:header -->` (`ui:bar`,
//   `ui:footer`) comment, else first in <body> (last, for the footer).
// - The brand (docs/brand.md): favicon.svg with its 32 px PNG fallback and the
//   Apple touch icon on every page; on full-header pages the everyday mark,
//   light and dark, which the header shows by theme.
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

export interface Asset {
  fileName: string;
  source: string | Uint8Array;
  type: string;
}

const file = (name: string): URL => new URL(name, import.meta.url);
const read = (name: string): string => readFileSync(file(name), 'utf8');
const hash = (s: string | Uint8Array): string =>
  createHash('sha256').update(s).digest('hex').slice(0, 8);

/** The font file, and the @font-face that points at it from the CSS (both in assets/). */
function fontAsset(): { asset: Asset; face: string } {
  const source = readFileSync(file('fonts/archivo.woff2'));
  const fileName = `assets/archivo-${hash(source)}.woff2`;
  const face =
    "@font-face { font-family: 'Archivo'; src: url('" +
    fileName.slice('assets/'.length) +
    "') format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; font-display: swap; }";
  return { asset: { fileName, source, type: 'font/woff2' }, face };
}

/** The files this page set needs, with content-hashed names under assets/. */
/** A brand file under packages/ui/brand, as a hashed asset; undefined if it's missing. */
function brandAsset(name: string, type: string): Asset | undefined {
  const url = file(`../brand/${name}`);
  if (!existsSync(url)) return undefined;
  const source = readFileSync(url);
  const dot = name.lastIndexOf('.');
  const fileName = `assets/${name.slice(0, dot)}-${hash(source)}${name.slice(dot)}`;
  return { fileName, source, type };
}

export interface Brand {
  favicon: Asset | undefined;
  faviconPng: Asset | undefined;
  appleTouch: Asset | undefined;
  /** The everyday mark, light and dark; full-header pages only. */
  mark: { light: Asset; dark: Asset } | undefined;
}

export function brandAssets(full: boolean): Brand {
  const light = full ? brandAsset('mark.svg', 'image/svg+xml') : undefined;
  const dark = full ? brandAsset('mark-dark.svg', 'image/svg+xml') : undefined;
  return {
    favicon: brandAsset('favicon.svg', 'image/svg+xml'),
    faviconPng: brandAsset('favicon-32.png', 'image/png'),
    appleTouch: brandAsset('apple-touch-icon-180.png', 'image/png'),
    mark: light && dark ? { light, dark } : undefined,
  };
}

/** The files this page set needs, with content-hashed names under assets/. */
export function uiAssets(opts: UiOptions): {
  css: Asset;
  theme: Asset | undefined;
  font: Asset | undefined;
  brand: Brand;
  /** Every file to emit or serve. */
  all: Asset[];
} {
  const full = Boolean(opts.header);
  const font = full ? fontAsset() : undefined;
  const cssSource = [
    ...(font ? [font.face] : []),
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
  const brand = brandAssets(full);
  const all = [
    css,
    theme,
    font?.asset,
    brand.favicon,
    brand.faviconPng,
    brand.appleTouch,
    brand.mark?.light,
    brand.mark?.dark,
  ].filter((a): a is Asset => a !== undefined);
  return { css, theme, font: font?.asset, brand, all };
}

/** The partials, rendered. `current` (from a page's marker) wins over the option's. */
export function uiPartials(
  opts: UiOptions,
  section?: Current,
  mark?: { light: string; dark: string },
): Record<'header' | 'bar' | 'footer', string | null> {
  const current = section ?? (typeof opts.header === 'object' ? opts.header.current : undefined);
  return {
    header: opts.header
      ? render(h(Header, { ...(current ? { current } : {}), ...(mark ? { mark } : {}) }))
      : null,
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

const CURRENTS: ReadonlySet<string> = new Set<Current>([
  'home',
  'features',
  'how-it-works',
  'examples',
]);
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
      const { css, theme, font, brand } = uiAssets(opts);
      const prefix = assetPrefix(base, ctx.path);
      const page = pageCurrent(html);
      const mark = brand.mark
        ? { light: prefix + brand.mark.light.fileName, dark: prefix + brand.mark.dark.fileName }
        : undefined;
      const icon = (rel: string, a: Asset | undefined, extra: Record<string, string> = {}) =>
        a
          ? [
              {
                tag: 'link',
                attrs: { rel, href: prefix + a.fileName, ...extra },
                injectTo: 'head' as const,
              },
            ]
          : [];
      return {
        html: placePartials(page.html, uiPartials(opts, page.current, mark)),
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
          ...(font
            ? [
                {
                  tag: 'link',
                  attrs: {
                    rel: 'preload',
                    href: prefix + font.fileName,
                    as: 'font',
                    type: 'font/woff2',
                    crossorigin: '',
                  },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          {
            tag: 'link',
            attrs: { rel: 'stylesheet', href: prefix + css.fileName },
            injectTo: 'head',
          },
          ...icon('icon', brand.favicon, { type: 'image/svg+xml' }),
          ...icon('icon', brand.faviconPng, { type: 'image/png', sizes: '32x32' }),
          ...icon('apple-touch-icon', brand.appleTouch),
        ],
      };
    },
    generateBundle() {
      for (const a of uiAssets(opts).all)
        this.emitFile({ type: 'asset', fileName: a.fileName, source: a.source });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const hit = uiAssets(opts).all.find((a) => path.endsWith(`/${a.fileName}`));
        if (!hit) {
          next();
          return;
        }
        res.setHeader(
          'Content-Type',
          typeof hit.source === 'string' ? `${hit.type}; charset=utf-8` : hit.type,
        );
        res.end(hit.source);
      });
    },
  };
}
