// After the build: the native bundles carry no Isoloop code. Minified code
// keeps string literals, so it looks for ones Isoloop carries: its render
// format, route topic and bus worker name.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ISOLOOP = ['@isoloop/', 'isoloop-dom@', 'isoloop.route.', 'isoloop-bus'];

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

let failed = false;
for (const dir of ['dist/native', 'dist/native-workers']) {
  const hits = scan(dir, ISOLOOP);
  if (hits.length > 0) {
    console.error(`${dir} contains Isoloop code:\n${hits.join('\n')}`);
    failed = true;
  } else console.log(`${dir}: no Isoloop code`);
}
// The check must be able to fail: the Isoloop build has the markers.
if (scan('dist/isoloop', ISOLOOP).length === 0) {
  console.error('dist/isoloop has no Isoloop markers: the check would miss it');
  failed = true;
}
if (failed) process.exit(1);
