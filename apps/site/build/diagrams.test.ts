import { describe, expect, it } from 'vitest';
import {
  decodeDataUrl,
  extractDataUrls,
  inlineLeftovers,
  patchViewerScript,
  rewritePage,
  stylesToClasses,
} from './diagrams.ts';

describe('stylesToClasses', () => {
  it('turns style attributes into shared classes, merging an existing class', () => {
    const html =
      '<g class="node" style="--step:3"><rect style="fill: var(--arrow-emphasis)"/></g><g style="--step:3"></g>';
    const { html: out, rules } = stylesToClasses(html);
    expect(out).not.toContain('style=');
    const [step, fill] = [...rules.keys()];
    expect(out).toContain(`<g class="node ${step}">`);
    expect(out).toContain(`<rect class="${fill}"/>`);
    expect(out.match(new RegExp(step ?? 'x', 'g'))).toHaveLength(2);
    // Custom properties keep normal priority; other declarations outrank the viewer's rules.
    expect(rules.get(step ?? '')).toBe(`.${step} { --step:3; }`);
    expect(rules.get(fill ?? '')).toBe(`.${fill} { fill: var(--arrow-emphasis) !important; }`);
  });

  it('leaves script blocks alone, and attribute values holding >', () => {
    const html =
      '<script type="application/json">{"a":"<b style=\\"x\\">"}</script><p title="a > b" style="color: red">t</p>';
    const { html: out } = stylesToClasses(html);
    expect(out).toContain('{"a":"<b style=\\"x\\">"}');
    expect(out).toMatch(/<p class="dg-s-[0-9a-f]+" title="a > b">t<\/p>/);
  });
});

describe('inlineLeftovers', () => {
  it('allows JSON data blocks and external scripts', () => {
    expect(
      inlineLeftovers('<script type="application/json">{}</script><script src="./v.js"></script>'),
    ).toEqual([]);
  });

  it('finds what the policy would block', () => {
    const found = inlineLeftovers(
      '<script>alert(1)</script><style>p{}</style><p style="x" onclick="y"><img src="data:image/png;base64,AA">',
    );
    expect(found.join(' | ')).toMatch(
      /inline <script>.*<style> block.*style attribute.*event handler.*data: URL/,
    );
  });
});

describe('rewritePage', () => {
  it('puts the policy, the theme script and the CSS first in <head>', () => {
    const out = rewritePage(
      '<html><head><title>t</title></head><body style="--step:1"></body></html>',
      new Map(),
      {
        csp: "default-src 'self'",
        themeSrc: '/assets/ui-theme-1.js',
        inlineCss: './dg-inline-1.css',
      },
    );
    expect(out).toMatch(
      /^<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'"><script src="\/assets\/ui-theme-1.js" data-archify><\/script><link rel="stylesheet" href=".\/dg-inline-1.css"><title>/,
    );
  });

  it('fails on anything inline it can not rewrite', () => {
    expect(() =>
      rewritePage('<html><head></head><body><style>p{}</style></body></html>', new Map(), {
        csp: 'x',
        themeSrc: '/t.js',
        inlineCss: './c.css',
      }),
    ).toThrow(/<style> block/);
  });
});

describe('extractDataUrls', () => {
  it('moves data: URLs into files, whichever quotes they use', () => {
    const svg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    const css = `a{background:url("${svg}")} @font-face{src:url(data:font/woff2;base64,d09GMg==)}`;
    const { css: out, files } = extractDataUrls(css);
    expect(out).not.toContain('data:');
    expect(
      files.map((f) => f.fileName.split('.').pop() ?? '').toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['svg', 'woff2']);
    expect(out).toMatch(/url\("\.\/dg-[0-9a-f]+\.svg"\)/);
  });

  it('decodes base64 and percent-encoded payloads', () => {
    expect(new TextDecoder().decode(decodeDataUrl('data:image/svg+xml,%3Csvg%2F%3E').bytes)).toBe(
      '<svg/>',
    );
    expect([...decodeDataUrl('data:font/woff2;base64,AAE=').bytes]).toEqual([0, 1]);
  });

  it('refuses a type it has no file extension for', () => {
    expect(() => extractDataUrls('a{b:url(data:application/x-foo,zz)}')).toThrow(/no file type/);
  });
});

describe('patchViewerScript', () => {
  const viewer = [
    'function f(rules) {',
    "  var style = document.createElement('style');",
    "  style.setAttribute('data-ambient-flow-keyframes', 'true');",
    "  style.textContent = rules.join('\\n');",
    '  document.head.appendChild(style);',
    '}',
  ].join('\n');

  it('swaps the created <style> element for a constructable stylesheet', () => {
    const out = patchViewerScript(viewer);
    expect(out).not.toContain("createElement('style')");
    expect(out).toContain('new CSSStyleSheet()');
    expect(out).toContain('document.adoptedStyleSheets');
  });

  it('leaves a script without one alone', () => {
    expect(patchViewerScript('var a = 1;')).toBe('var a = 1;');
  });

  it('fails on a <style> element it does not recognise', () => {
    expect(() =>
      patchViewerScript("var s = document.createElement('style'); s.textContent = x;"),
    ).toThrow(/patchViewerScript/);
  });
});
