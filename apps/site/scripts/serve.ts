// A static file server for the assembled site (scripts/assemble-site.sh), as
// GitHub Pages serves it: a folder's index.html, /404.html for anything
// missing. No dependencies. `--mount /prefix/=<dir>` serves another folder
// under a path, e.g. ui's specimens for the smoke test.
//   node scripts/serve.ts <dir> [port] [--mount /__specimens/=../../packages/ui/dist/specimens]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const args = process.argv.slice(2);
const mounts: [string, string][] = [];
const rest: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i] ?? '';
  if (a === '--mount') {
    const [prefix, dir] = (args[++i] ?? '').split('=');
    if (prefix && dir) mounts.push([prefix, resolve(dir)]);
  } else rest.push(a);
}
const root = resolve(rest[0] ?? '../../site');
const port = Number(rest[1] ?? 4799);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.webm': 'video/webm',
};

function locate(urlPath: string): string | undefined {
  let base = root;
  let path = urlPath;
  for (const [prefix, dir] of mounts) {
    if (path.startsWith(prefix)) {
      base = dir;
      path = `/${path.slice(prefix.length)}`;
    }
  }
  const file = normalize(join(base, decodeURIComponent(path)));
  if (!file.startsWith(base)) return undefined;
  if (existsSync(file) && statSync(file).isDirectory()) {
    const index = join(file, 'index.html');
    return existsSync(index) ? index : undefined;
  }
  return existsSync(file) ? file : undefined;
}

createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0] ?? '/';
  // A folder without its slash redirects, as Pages does.
  const bare = normalize(join(root, decodeURIComponent(path)));
  if (!path.endsWith('/') && existsSync(bare) && statSync(bare).isDirectory()) {
    res.writeHead(301, { Location: `${path}/` }).end();
    return;
  }
  const file = locate(path);
  const status = file ? 200 : 404;
  const served = file ?? join(root, '404.html');
  if (!existsSync(served)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(status, { 'Content-Type': TYPES[extname(served)] ?? 'application/octet-stream' });
  createReadStream(served).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}/`));
