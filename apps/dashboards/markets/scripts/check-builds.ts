// After the build (M3b tasks 15 and 16b): the native bundles carry no Isoloop
// code, and the Preact bundles no React DOM. Minified code keeps string
// literals, so it looks for ones those packages carry: Isoloop's render
// format, route topic and bus worker name; React DOM's container key and
// error-page URL.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ISOLOOP = ['@isoloop/', 'isoloop-dom@', 'isoloop.route.', 'isoloop-bus'];
const REACT_DOM = ['__reactContainer$', 'react.dev/errors/'];

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );

const scan = (dir: string, markers: string[]): string[] =>
  files(dir)
    .filter((f) => /\.(js|html|css)$/.test(f))
    .flatMap((f) => {
      const text = readFileSync(f, 'utf8');
      return markers.filter((m) => text.includes(m)).map((m) => `${f}: ${m}`);
    });

const rules: [dir: string, what: string, markers: string[]][] = [
  ['dist/native', 'Isoloop code', ISOLOOP],
  ['dist/native-preact', 'Isoloop code', ISOLOOP],
  ['dist/native-preact', 'React DOM', REACT_DOM],
  ['dist/isoloop-preact', 'React DOM', REACT_DOM],
  ['dist/mixed/preact', 'React DOM', REACT_DOM],
];

let failed = false;
for (const [dir, what, markers] of rules) {
  const hits = scan(dir, markers);
  if (hits.length > 0) {
    console.error(`${dir} contains ${what}:\n${hits.join('\n')}`);
    failed = true;
  } else console.log(`${dir}: no ${what}`);
}
// The check must be able to fail: React's own build has the markers.
if (scan('dist/native', REACT_DOM).length === 0) {
  console.error('dist/native has no React DOM markers: the check would miss it');
  failed = true;
}
if (failed) process.exit(1);
