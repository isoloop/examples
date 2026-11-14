/** @jsxImportSource preact */
import { describe, expect, it } from 'vitest';
import { CSP, renderDocument } from './plugin.ts';
import type { Page, SiteData } from '../src/pages/index.ts';
import { PAGES } from '../src/pages/index.ts';

function named(name: string): Page {
  const page = PAGES[name];
  if (!page) throw new Error(`no page ${name}`);
  return page;
}

const data: SiteData = {
  pin: 'f'.repeat(40),
  diagrams: [{ name: 'runtime-topology', title: 'Isoloop runtime topology' }],
  examples: [
    {
      id: 'basic',
      title: 'Basic <b>',
      summary: 'Four isolates.',
      links: { live: '/examples/basic/', source: 'https://github.com/isoloop/web' },
    },
  ],
};

describe('renderDocument', () => {
  const page: Page = {
    path: '/x/',
    section: 'examples',
    head: { title: 'X', description: 'D' },
    render: () => <main>hello</main>,
  };

  it('writes a whole document with the policy, head tags and ui markers', () => {
    const html = renderDocument(page, data, { csp: CSP });
    expect(html).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="${CSP}"/>`);
    expect(html).toContain('<title>X · Isoloop</title>');
    expect(html).toContain('<link rel="canonical" href="https://isoloop.dev/x/"/>');
    expect(html).toContain('<!-- ui:header:examples -->');
    expect(html).toContain('<main>hello</main>');
    expect(html).toContain('<!-- ui:footer -->');
  });

  it('leaves the policy out in dev', () => {
    expect(renderDocument(page, data, {})).not.toContain('Content-Security-Policy');
  });
});

describe('the pages', () => {
  it('render from data, escaping it', () => {
    const html = renderDocument(named('examples'), data, { csp: CSP });
    expect(html).toContain('Basic &lt;b>');
    expect(html).not.toContain('Basic <b>');
  });

  it('embed basic and the topology diagram on the landing page, same-origin', () => {
    const html = renderDocument(named('home'), data, { csp: CSP });
    expect(html).toContain('<iframe src="/examples/basic/?embed=1"');
    expect(html).toContain('src="/how-it-works/diagrams/runtime-topology.html"');
    expect(html).toContain('href="/examples/dashboards/plant/"');
    expect(html).not.toMatch(/(src|href)="http:\/\//);
  });

  it('show the pin on "how it works"', () => {
    const html = renderDocument(named('how-it-works'), data, { csp: CSP });
    expect(html).toContain('<code>fffffff</code>');
  });

  it('never claim Isoloop is faster than native', () => {
    for (const p of Object.values(PAGES)) {
      expect(renderDocument(p, data, {}).toLowerCase()).not.toMatch(/faster than native/);
    }
  });
});
