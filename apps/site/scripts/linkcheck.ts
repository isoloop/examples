// The internal link check (ADR 0002, decision 11): every href and src in every
// HTML page of the assembled site that points inside the site must resolve to
// a file, as GitHub Pages would serve it. External links aren't checked.
// No dependencies.   node scripts/linkcheck.ts <dir>
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '../../site');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

/** Where a link from `page` lands on disk, or undefined if it leaves the site. */
export function target(page: string, link: string): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('//') || link.startsWith('#'))
    return undefined;
  const path = link.split(/[?#]/)[0] ?? '';
  if (!path) return undefined;
  const abs = path.startsWith('/') ? join(root, path) : join(dirname(page), path);
  if (existsSync(abs) && statSync(abs).isDirectory()) return join(abs, 'index.html');
  return abs;
}

const ATTR = /\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const broken: string[] = [];
let checked = 0;
const pages = htmlFiles(root);
for (const page of pages) {
  // Script bodies (the diagrams' JSON data, the old-path redirects) aren't markup.
  const html = readFileSync(page, 'utf8').replace(SCRIPT, (s) => s.replace(/>[\s\S]*<\//, '></'));
  for (const m of html.matchAll(ATTR)) {
    const link = (m[1] ?? m[2] ?? '').trim();
    const file = target(page, link);
    if (!file) continue;
    checked++;
    if (!existsSync(file)) broken.push(`${relative(root, page)}: ${link}`);
  }
}
if (broken.length) {
  console.error(`${broken.length} broken internal links:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`${checked} internal links in ${pages.length} pages: all resolve`);
