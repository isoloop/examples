import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadExamples, webpSize } from './examples.ts';

function repo(apps: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), 'site-examples-'));
  for (const [id, json] of Object.entries(apps)) {
    const dir = join(root, 'apps', id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{}');
    if (json !== undefined) writeFileSync(join(dir, 'example.json'), JSON.stringify(json));
  }
  return root;
}

const valid = {
  title: 'Basic',
  summary: 'Four isolates.',
  links: { live: '/examples/basic/', source: 'https://github.com/isoloop/web' },
};

describe('loadExamples', () => {
  it('reads every app at any depth, skips the site, and sorts by order', () => {
    const root = repo({
      site: undefined,
      basic: { ...valid, order: 10 },
      'dashboards/plant': {
        ...valid,
        title: 'Plant',
        order: 5,
        result: { line: 'r', tag: 'plant-v0.1.0' },
      },
    });
    expect(loadExamples(root).map((e) => [e.id, e.title])).toEqual([
      ['dashboards/plant', 'Plant'],
      ['basic', 'Basic'],
    ]);
  });

  it('names the file when example.json is missing', () => {
    expect(() => loadExamples(repo({ basic: undefined }))).toThrow(
      /apps\/basic\/example.json is missing/,
    );
  });

  it('names the file and the field when it is invalid', () => {
    const root = repo({
      basic: { ...valid, links: { live: 'examples/basic', source: 'http://x' } },
    });
    expect(() => loadExamples(root)).toThrow(
      /apps\/basic\/example.json is invalid:\n.*links.live/s,
    );
    expect(() => loadExamples(root)).toThrow(/links.source/);
  });

  it('refuses unknown fields, so a typo fails', () => {
    expect(() => loadExamples(repo({ basic: { ...valid, sumary: 'x' } }))).toThrow(/sumary/);
  });

  it('refuses a result without a release tag', () => {
    const root = repo({ basic: { ...valid, result: { line: 'r', tag: 'latest' } } });
    expect(() => loadExamples(root)).toThrow(/result.tag/);
  });

  it('needs the screenshot it names', () => {
    const root = repo({ basic: { ...valid, screenshot: 'screenshot.webp' } });
    expect(() => loadExamples(root)).toThrow(/screenshot.webp doesn't exist/);
  });
});

const ascii = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0));

const riff = (chunk: string, body: number[]): Uint8Array =>
  Uint8Array.from(ascii('RIFF').concat([0, 0, 0, 0], ascii(`WEBP${chunk}`), [0, 0, 0, 0], body));

describe('webpSize', () => {
  it('reads a lossy (VP8) header', () => {
    // frame tag (3), start code (3), then 14-bit width and height.
    const body = [0, 0, 0, 0x9d, 0x01, 0x2a, 0xc0, 0x03, 0x58, 0x02];
    expect(webpSize(riff('VP8 ', body))).toEqual({ width: 960, height: 600 });
  });

  it('reads an extended (VP8X) header', () => {
    const body = [0, 0, 0, 0, 0xbf, 0x03, 0x00, 0x57, 0x02, 0x00];
    expect(webpSize(riff('VP8X', body))).toEqual({ width: 960, height: 600 });
  });

  it('refuses a file that is not WebP', () => {
    expect(() => webpSize(new Uint8Array(30))).toThrow(/not a WebP/);
  });
});
