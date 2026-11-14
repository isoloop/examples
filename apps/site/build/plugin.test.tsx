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
  samples: {
    contracts: 'c',
    durable: 'd',
    placement: 'p',
    grants: 'g',
    react: 'r',
    preact: 'pr',
    vanilla: 'v',
  },
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

  it('put the live recording on the landing page, drawn by a same-origin module script', () => {
    const html = renderDocument(named('home'), data, { csp: CSP });
    // basic's iframe is created by the script, out of view, once the recording is near.
    expect(html).toContain('data-demo="recording"');
    expect(html).toContain('<script type="module" src="/src/demos/home.ts"></script>');
    expect(html).toContain('href="/features/"');
    expect(html).toContain('href="/examples/basic/"');
    expect(html).not.toMatch(/(src|href)="http:\/\//);
    expect(html).not.toMatch(/sketch/i);
  });

  it('give /features/ nine sections, three live demos and the checked samples', () => {
    const html = renderDocument(named('features'), data, { csp: CSP });
    for (const id of [
      'containment',
      'restart',
      'bus',
      'replay',
      'durable',
      'placement',
      'frameworks',
      'safety',
      'cost',
    ])
      expect(html).toContain(`id="${id}"`);
    for (const demo of ['recording', 'bus', 'replay'])
      expect(html).toContain(`data-demo="${demo}"`);
    expect(html).toContain('<code>c</code>');
    expect(html).toContain('<script type="module" src="/src/demos/features.ts"></script>');
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
