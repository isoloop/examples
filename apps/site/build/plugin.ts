// The site's build-time code (ADR 0002, decision 1, as amended by ADR 0003):
// pages are Preact components, rendered to static HTML through ui's render().
// No framework code reaches the browser.
//
// - Pages: each `index.html` stub holds `<!-- page:<name> -->`; it becomes a
//   whole document (head tags, header and footer markers for ui/vite, the page)
//   before Vite processes it, so CSS bundling and hashing work as usual.
// - The hub's screenshots: copied to /examples/img/ (build/examples.ts).
// - The diagrams: the pinned library pages, rewritten for the policy, under
//   /how-it-works/diagrams/ (build/diagrams.ts).
// In dev, pages are loaded fresh on each request and a change reloads the page.
import { readFileSync } from 'node:fs';
import { h } from 'preact';
import { Head, type HeadProps } from 'ui/components';
import { render } from 'ui/render';
import { uiAssets } from 'ui/vite';
import type { Plugin, ViteDevServer } from 'vite';
import { buildDiagramFiles, DIAGRAMS_PATH, type EmittedFile } from './diagrams.ts';
import type { Page, SiteData } from '../src/pages/index.ts';

/** Every page's policy (ADR 0002, decision 8). */
export const CSP = "default-src 'self'";

const STUB = /^\s*<!--\s*page:([a-z0-9-]+)\s*-->\s*$/;

/** The whole document for a page. `csp` is left out in dev, where Vite injects inline styles. */
export function renderDocument(page: Page, data: SiteData, opts: { csp?: string }): string {
  const head = render(
    h(Head, {
      ...page.head,
      path: page.path,
      ...(opts.csp ? { csp: opts.csp } : {}),
    } satisfies HeadProps),
  );
  const marker = page.section ? `<!-- ui:header:${page.section} -->` : '<!-- ui:header -->';
  return (
    '<!doctype html>\n<html lang="en">\n<head>\n' +
    head +
    '\n<link rel="stylesheet" href="/src/site.css">\n</head>\n<body>\n' +
    marker +
    '\n' +
    render(page.render(data)) +
    '\n<!-- ui:footer -->\n</body>\n</html>\n'
  );
}

/** The PAGES export of a freshly loaded pages module (dev). */
function pagesOf(mod: Record<string, unknown>): Record<string, Page> {
  const pages = mod['PAGES'];
  if (typeof pages !== 'object' || pages === null)
    throw new Error('the pages module exports no PAGES');
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the same module the build imports, typed there
  return pages as Record<string, Page>;
}

export interface SiteOptions {
  pages: Record<string, Page>;
  data: SiteData;
  /** The pinned diagrams' folder (build/library.ts). */
  diagramsDir: string;
  /** In dev: the module that exports PAGES, loaded fresh on each request. */
  pagesModule: string;
}

function diagramFiles(dir: string): EmittedFile[] {
  const theme = uiAssets({ header: true }).theme;
  if (!theme) throw new Error('ui/vite emits no theme script');
  return buildDiagramFiles(dir, { csp: CSP, themeSrc: `/${theme.fileName}` });
}

const TYPES: Record<string, string> = {
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  svg: 'image/svg+xml',
  woff2: 'font/woff2',
  woff: 'font/woff',
  webp: 'image/webp',
};

export function site(opts: SiteOptions): Plugin {
  let server: ViteDevServer | undefined;
  let devDiagrams: Map<string, EmittedFile> | undefined;
  return {
    name: 'site',
    configureServer(s) {
      server = s;
      s.watcher.on('change', (file) => {
        if (/\/apps\/site\/src\/|\/packages\/ui\/src\/components\//.test(file)) {
          s.ws.send({ type: 'full-reload' });
        }
      });
      s.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        let file: { source: string | Uint8Array; type: string } | undefined;
        if (path.startsWith(`/${DIAGRAMS_PATH}`)) {
          devDiagrams ??= new Map(diagramFiles(opts.diagramsDir).map((f) => [f.fileName, f]));
          const hit = devDiagrams.get(path.slice(DIAGRAMS_PATH.length + 1));
          if (hit)
            file = { source: hit.source, type: TYPES[hit.fileName.split('.').pop() ?? ''] ?? '' };
        } else {
          const shot = opts.data.examples.find((e) => e.image?.src === path)?.image;
          if (shot) file = { source: readFileSync(shot.file), type: 'image/webp' };
        }
        if (!file) {
          next();
          return;
        }
        res.setHeader('Content-Type', file.type);
        res.end(file.source);
      });
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        const m = STUB.exec(html);
        if (!m) return html;
        const name = m[1] ?? '';
        const pages = server ? pagesOf(await server.ssrLoadModule(opts.pagesModule)) : opts.pages;
        const page = pages[name];
        if (!page) throw new Error(`no page named "${name}" (apps/site/src/pages/index.ts)`);
        return renderDocument(page, opts.data, server ? {} : { csp: CSP });
      },
    },
    generateBundle() {
      for (const e of opts.data.examples) {
        if (!e.image) continue;
        this.emitFile({
          type: 'asset',
          fileName: e.image.src.slice(1),
          source: readFileSync(e.image.file),
        });
      }
      for (const f of diagramFiles(opts.diagramsDir)) {
        this.emitFile({ type: 'asset', fileName: DIAGRAMS_PATH + f.fileName, source: f.source });
      }
    },
  };
}
