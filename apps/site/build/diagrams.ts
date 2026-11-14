// The library's diagrams on "how it works" (ADR 0002, decision 6): the pinned
// Archify pages, copied to /how-it-works/diagrams/ and rewritten so they run
// under the site's policy, `default-src 'self'` (decision 8), with the theme
// script from packages/ui (decision 8, ADR 0003 decision 4).
//
// What Archify leaves that the policy would block, and what replaces it:
// - `style="…"` attributes (the reveal order, `--step:N`, and one fill) become
//   classes, `dg-s-<hash>`, with the same declarations in a generated CSS file.
//   Ordinary declarations are marked !important, as an inline style outranks
//   the viewer's rules; custom properties aren't (see importantDeclarations).
// - `url(data:…)` in the viewer's CSS (fonts and SVG icons) become files next
//   to the pages.
// - One `<style>` element the viewer creates for its flow keyframes becomes a
//   constructable stylesheet, which the policy doesn't govern.
// Anything else inline (a `<style>` block, an executable inline `<script>`, an
// `on…=` handler, a `data:` URL left in a page) fails the build, so a re-render
// that brings a new one is caught here, not in a visitor's console.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The diagrams in reading order (the library's docs/diagrams/README.md). */
export const DIAGRAM_ORDER = [
  'runtime-topology',
  'placement',
  'bus-publish',
  'isolate-lifecycle',
  'restart-own-worker',
  'restart-pool',
  'bus-crash-reattach',
] as const;
export type DiagramName = (typeof DIAGRAM_ORDER)[number];

export interface Diagram {
  name: DiagramName;
  /** The diagram's own title, from its JSON. */
  title: string;
}

export const DIAGRAMS_PATH = 'how-it-works/diagrams/';

const hash = (s: string | Uint8Array): string =>
  createHash('sha256').update(s).digest('hex').slice(0, 10);

/** Titles from each diagram's JSON, in reading order. */
export function readDiagrams(dir: string): Diagram[] {
  return DIAGRAM_ORDER.map((name) => {
    const json: unknown = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
    const title =
      typeof json === 'object' && json !== null && 'title' in json && typeof json.title === 'string'
        ? json.title
        : name;
    return { name, title };
  });
}

// A start tag, with quoted attribute values that may hold `>`.
const TAG =
  /<[a-zA-Z][^\s/>]*(?:\s+[^\s"'=<>`/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>/g;
const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/** Splits html into script blocks (left as they are) and the rest. */
function outsideScripts(html: string, fn: (chunk: string) => string): string {
  let out = '';
  let last = 0;
  for (const m of html.matchAll(SCRIPT_BLOCK)) {
    out += fn(html.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + fn(html.slice(last));
}

function importantDeclarations(style: string): string {
  return (
    style
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      // Custom properties stay at normal priority: the viewer's own script may
      // set them on an element (CSSOM), and should still win.
      .map((d) => (/!important$/i.test(d) || d.startsWith('--') ? d : `${d} !important`))
      .join('; ')
  );
}

/** Turns each `style="…"` attribute into a class; returns the rules it needs. */
export function stylesToClasses(html: string): { html: string; rules: Map<string, string> } {
  const rules = new Map<string, string>();
  const rewritten = outsideScripts(html, (chunk) =>
    chunk.replace(TAG, (tag) => {
      const style = /\sstyle\s*=\s*"([^"]*)"/i.exec(tag) ?? /\sstyle\s*=\s*'([^']*)'/i.exec(tag);
      if (!style) return tag;
      const value = (style[1] ?? '').trim();
      let out = tag.replace(style[0], '');
      if (value) {
        const cls = `dg-s-${hash(value)}`;
        rules.set(cls, `.${cls} { ${importantDeclarations(value)}; }`);
        const existing = /\sclass\s*=\s*"([^"]*)"/i.exec(out);
        out = existing
          ? out.replace(existing[0], ` class="${existing[1]} ${cls}"`)
          : out.replace(/^(<[a-zA-Z][^\s/>]*)/, `$1 class="${cls}"`);
      }
      return out;
    }),
  );
  return { html: rewritten, rules };
}

/** What may not be left in a page once it has been rewritten. */
export function inlineLeftovers(html: string): string[] {
  const found: string[] = [];
  for (const m of html.matchAll(SCRIPT_BLOCK)) {
    const attrs = m[1] ?? '';
    const body = (m[2] ?? '').trim();
    const type = /\stype\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]?.toLowerCase();
    const data = type !== undefined && type !== 'module' && !type.includes('javascript');
    if (body && !data) found.push('an inline <script>');
  }
  outsideScripts(html, (chunk) => {
    if (/<style\b/i.test(chunk)) found.push('a <style> block');
    for (const tag of chunk.match(TAG) ?? []) {
      if (/\sstyle\s*=/i.test(tag)) found.push('a style attribute');
      if (/\son[a-z]+\s*=/i.test(tag))
        found.push(`an event handler attribute in ${tag.slice(0, 40)}`);
      if (/=\s*["']?\s*data:/i.test(tag)) found.push(`a data: URL in ${tag.slice(0, 40)}`);
    }
    return chunk;
  });
  return found;
}

/** Puts `markup` first in <head>. */
function prependToHead(html: string, markup: string): string {
  if (!/<head\b[^>]*>/i.test(html)) throw new Error('diagram page has no <head>');
  return html.replace(/<head\b[^>]*>/i, (m) => m + markup);
}

export interface PageOptions {
  /** The page's CSP, e.g. `default-src 'self'`. */
  csp: string;
  /** The ui theme script, root-absolute. */
  themeSrc: string;
  /** The generated CSS file for the former style attributes, relative to the page. */
  inlineCss: string;
}

/** A diagram page, rewritten for the policy and given the theme script. */
export function rewritePage(html: string, rules: Map<string, string>, opts: PageOptions): string {
  const { html: classed, rules: own } = stylesToClasses(html);
  for (const [k, v] of own) rules.set(k, v);
  const withHead = prependToHead(
    classed,
    `<meta http-equiv="Content-Security-Policy" content="${opts.csp}">` +
      `<script src="${opts.themeSrc}" data-archify></script>` +
      `<link rel="stylesheet" href="${opts.inlineCss}">`,
  );
  const left = inlineLeftovers(withHead);
  if (left.length) {
    throw new Error(`diagram page still has ${[...new Set(left)].join(', ')} after rewriting`);
  }
  return withHead;
}

export interface EmittedFile {
  fileName: string;
  source: string | Uint8Array;
}

// url("data:…"), url('data:…') or url(data:…); a quoted payload may hold the other quote.
const DATA_URL = /url\(\s*(?:"(data:[^"]*)"|'(data:[^']*)'|(data:[^)\s]*))\s*\)/gi;
const EXTENSIONS: Record<string, string> = {
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf',
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/** Decodes a data: URL to bytes and its media type. */
export function decodeDataUrl(url: string): { type: string; bytes: Uint8Array } {
  const m = /^data:([^;,]*)((?:;[^;,]*)*),(.*)$/s.exec(url);
  if (!m) throw new Error(`not a data: URL: ${url.slice(0, 40)}`);
  const type = (m[1] || 'text/plain').toLowerCase();
  const base64 = /;base64/i.test(m[2] ?? '');
  const payload = m[3] ?? '';
  const bytes = base64
    ? Uint8Array.from(Buffer.from(payload, 'base64'))
    : new TextEncoder().encode(decodeURIComponent(payload));
  return { type, bytes };
}

/** Moves every `url(data:…)` in a stylesheet into its own file. */
export function extractDataUrls(css: string): { css: string; files: EmittedFile[] } {
  const files = new Map<string, EmittedFile>();
  const out = css.replace(DATA_URL, (_m, dq?: string, sq?: string, bare?: string) => {
    const { type, bytes } = decodeDataUrl(dq ?? sq ?? bare ?? '');
    const ext = EXTENSIONS[type];
    if (!ext) throw new Error(`no file type for a data: URL of type ${type}`);
    const fileName = `dg-${hash(bytes)}.${ext}`;
    files.set(fileName, { fileName, source: bytes });
    return `url("./${fileName}")`;
  });
  if (/data:/i.test(out.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    throw new Error('a stylesheet still has a data: URL the site could not move into a file');
  }
  return { css: out, files: [...files.values()] };
}

// The viewer's flow keyframes, as Archify writes them, and their replacement.
const KEYFRAMES_STYLE = [
  "var style = document.createElement('style');",
  "style.setAttribute('data-ambient-flow-keyframes', 'true');",
  "style.textContent = rules.join('\\n');",
  'document.head.appendChild(style);',
];
const KEYFRAMES_SHEET =
  "var sheet = new CSSStyleSheet(); sheet.replaceSync(rules.join('\\n')); " +
  'document.adoptedStyleSheets = document.adoptedStyleSheets.concat([sheet]);';

/** Swaps the viewer's created `<style>` element for a constructable stylesheet. */
export function patchViewerScript(js: string): string {
  if (!/createElement\(\s*['"]style['"]\s*\)/.test(js)) return js;
  const pattern = new RegExp(
    KEYFRAMES_STYLE.map((line) => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'),
  );
  if (!pattern.test(js)) {
    throw new Error(
      "the diagram viewer creates a <style> element in a way the site doesn't know how to replace; " +
        'update patchViewerScript (apps/site/build/diagrams.ts) for the new viewer',
    );
  }
  const out = js.replace(pattern, KEYFRAMES_SHEET);
  if (/createElement\(\s*['"]style['"]\s*\)/.test(out)) {
    throw new Error('the diagram viewer creates more than one <style> element');
  }
  return out;
}

const readText = (p: string): string => readFileSync(p, 'utf8');

/**
 * Every file under /how-it-works/diagrams/: the pages, the viewer's scripts and
 * stylesheets (rewritten), the files pulled out of their data: URLs, and the
 * CSS for the former style attributes.
 */
export function buildDiagramFiles(
  dir: string,
  opts: Omit<PageOptions, 'inlineCss'>,
): EmittedFile[] {
  const files: EmittedFile[] = [];
  for (const name of readdirSync(dir).toSorted()) {
    if (/^viewer-.*\.js$/.test(name)) {
      files.push({ fileName: name, source: patchViewerScript(readText(join(dir, name))) });
    } else if (/^viewer-.*\.css$/.test(name)) {
      const { css, files: extracted } = extractDataUrls(readText(join(dir, name)));
      files.push({ fileName: name, source: css }, ...extracted);
    }
  }
  const rules = new Map<string, string>();
  // First pass collects the rules, so the CSS file's name (its hash) is known.
  const sources = DIAGRAM_ORDER.map((name) => ({
    name,
    html: readText(join(dir, `${name}.html`)),
  }));
  for (const { html } of sources) for (const [k, v] of stylesToClasses(html).rules) rules.set(k, v);
  const css = [...rules.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([, rule]) => rule)
    .join('\n');
  const inlineCss = `dg-inline-${hash(css)}.css`;
  files.push({ fileName: inlineCss, source: `${css}\n` });
  for (const { name, html } of sources) {
    files.push({
      fileName: `${name}.html`,
      source: rewritePage(html, new Map(), { ...opts, inlineCss: `./${inlineCss}` }),
    });
  }
  return files;
}
