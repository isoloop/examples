// Moves the executable inline <script> blocks of each rendered diagram into
// shared files next to it, so the pages run under `script-src 'self'` (the
// Isoloop hosting guide's policy). JSON data blocks (`type="application/json"`)
// stay inline: a CSP doesn't apply to them. Archify renders the same viewer
// code into every page, so the files are named by content hash and shared.
//
// Run after re-rendering (README.md): node externalize.mjs
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;

for (const name of readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html')) {
  const path = join(dir, name);
  const html = readFileSync(path, 'utf8');
  let moved = 0;
  const out = html.replace(SCRIPT, (whole, attrs = '', body) => {
    if (/\btype=/.test(attrs) || /\bsrc=/.test(attrs) || body.trim() === '') return whole;
    const file = `viewer-${createHash('sha256').update(body).digest('hex').slice(0, 10)}.js`;
    writeFileSync(join(dir, file), body);
    moved++;
    return `<script src="./${file}"></script>`;
  });
  writeFileSync(path, out);
  console.log(`${name}: ${moved} script(s) moved`);
}
