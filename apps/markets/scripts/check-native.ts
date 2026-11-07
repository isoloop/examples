// After the build: the native bundle carries no Isoloop code (M3b task 15).
// Minified code keeps string literals, so it looks for the ones Isoloop's
// packages carry: the render format, the route topic, the bus worker's name.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MARKERS = ['@isoloop/', 'isoloop-dom@', 'isoloop.route.', 'isoloop-bus'];
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );

const dir = process.argv[2] ?? 'dist/native';
const hits = files(dir)
  .filter((f) => /\.(js|html|css)$/.test(f))
  .flatMap((f) => {
    const text = readFileSync(f, 'utf8');
    return MARKERS.filter((m) => text.includes(m)).map((m) => `${f}: ${m}`);
  });
if (hits.length > 0) {
  console.error(`the native build contains Isoloop code:\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(`${dir}: no Isoloop code`);
