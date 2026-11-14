// The examples hub's data (ADR 0002, decision 5): one example.json per app,
// validated at build time. A bad or missing file fails the build with an error
// naming the file and the field. A new example joins the hub by adding its
// example.json in the same PR as the app.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'zod';

const rootPath = z
  .string()
  .regex(/^\/[^\s]*$/, 'a root-absolute path on the site, starting with /');
const https = z.url({ protocol: /^https$/, error: 'an https URL' });

export const exampleSchema = z.strictObject({
  title: z.string().min(1),
  /** One line on what the example is. */
  summary: z.string().min(1),
  /** Where it sits on the hub; lower first. */
  order: z.number().int().optional(),
  /** One measured result, with the tag it was measured at. */
  result: z
    .strictObject({
      line: z.string().min(1),
      tag: z
        .string()
        .regex(/^[a-z]+-v\d+\.\d+\.\d+(-[0-9a-z.]+)?$/, 'a release tag, e.g. plant-v0.1.0'),
    })
    .optional(),
  /** Shown in place of a result while none is published yet, e.g. markets until M3f. */
  note: z.string().min(1).optional(),
  links: z.strictObject({
    live: rootPath,
    source: https,
    results: https.optional(),
    architecture: rootPath.optional(),
  }),
  /** A WebP next to example.json, written by `pnpm screenshots`. */
  screenshot: z
    .string()
    .regex(/^[a-z0-9-]+\.webp$/, 'a .webp file name next to example.json')
    .optional(),
});

export type ExampleJson = z.infer<typeof exampleSchema>;

export interface Example extends ExampleJson {
  /** The app's path below apps/, e.g. `dashboards/plant`. */
  id: string;
  /** The screenshot as served, with its size, if there is one. */
  image?: { src: string; file: string; width: number; height: number };
}

/** Width and height from a WebP file's header (VP8, VP8L or VP8X). */
export function webpSize(bytes: Uint8Array): { width: number; height: number } {
  const ascii = (at: number, n: number): string =>
    String.fromCharCode(...bytes.subarray(at, at + n));
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') throw new Error('not a WebP file');
  const chunk = ascii(12, 4);
  const u16 = (at: number): number => (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8);
  const u24 = (at: number): number => u16(at) | ((bytes[at + 2] ?? 0) << 16);
  if (chunk === 'VP8X') return { width: u24(24) + 1, height: u24(27) + 1 };
  if (chunk === 'VP8 ') return { width: u16(26) & 0x3fff, height: u16(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const b = (i: number): number => bytes[21 + i] ?? 0;
    const width = 1 + (((b(1) & 0x3f) << 8) | b(0));
    const height = 1 + (((b(3) & 0x0f) << 10) | (b(2) << 2) | ((b(1) & 0xc0) >> 6));
    return { width, height };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
}

/** Every folder under apps/ that holds a package.json, as paths below apps/. */
function appDirs(appsDir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(appsDir, prefix)).toSorted()) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${name}` : name;
    const dir = join(appsDir, rel);
    if (!statSync(dir).isDirectory()) continue;
    if (existsSync(join(dir, 'package.json'))) out.push(rel);
    else out.push(...appDirs(appsDir, rel));
  }
  return out;
}

/** The hub's examples, validated, in hub order. The site and its code samples aren't examples. */
export function loadExamples(repoRoot: string): Example[] {
  const appsDir = join(repoRoot, 'apps');
  const examples: Example[] = [];
  for (const id of appDirs(appsDir)) {
    if (id === 'site' || id === 'samples') continue;
    const file = join(appsDir, id, 'example.json');
    const where = relative(repoRoot, file);
    if (!existsSync(file)) throw new Error(`${where} is missing: every app needs one for the hub`);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      throw new Error(`${where}: not valid JSON (${e instanceof Error ? e.message : String(e)})`, {
        cause: e,
      });
    }
    const parsed = exampleSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  ${i.path.join('.') || '(top level)'}: ${i.message}`)
        .join('\n');
      throw new Error(`${where} is invalid:\n${issues}`);
    }
    const example: Example = { ...parsed.data, id };
    if (parsed.data.screenshot) {
      const shot = join(appsDir, id, parsed.data.screenshot);
      if (!existsSync(shot)) {
        throw new Error(`${where}: screenshot ${parsed.data.screenshot} doesn't exist`);
      }
      const size = webpSize(readFileSync(shot));
      example.image = { src: `/examples/img/${id.replace(/\//g, '-')}.webp`, file: shot, ...size };
    }
    examples.push(example);
  }
  return examples.toSorted(
    (a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title),
  );
}
