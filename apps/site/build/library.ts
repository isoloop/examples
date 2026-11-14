// The library's diagrams, fetched at the sha pinned in library.lock (ADR 0002,
// decision 6). One mechanism for CI and for local builds: a blob-less clone of
// isoloop/isoloop's main in apps/site/.library/, then only docs/diagrams at the
// pin. The pin must be reachable from main, so only diagrams that passed the
// drift test there reach the site. Once a pin has been fetched and checked, a
// stamp file lets later builds (and offline ones) reuse it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIBRARY_REPO = 'https://github.com/isoloop/isoloop.git';

/** The pinned sha, checked for shape. */
export function readPin(siteDir: string): string {
  const pin = readFileSync(join(siteDir, 'library.lock'), 'utf8').trim();
  if (!/^[0-9a-f]{40}$/.test(pin)) {
    throw new Error(`library.lock must hold one full 40-character sha, not "${pin}"`);
  }
  return pin;
}

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

/** Is `sha` an ancestor of (or equal to) `ref` in the repo at `repo`? */
export function isAncestor(repo: string, sha: string, ref: string): boolean {
  try {
    git(['merge-base', '--is-ancestor', sha, ref], repo);
    return true;
  } catch {
    return false;
  }
}

/**
 * Makes sure the pinned docs/diagrams is on disk and returns its folder.
 * Throws if the pin isn't on the library's main.
 */
export function ensureLibrary(siteDir: string, repoUrl: string = LIBRARY_REPO): string {
  const pin = readPin(siteDir);
  const cache = join(siteDir, '.library');
  const out = join(cache, pin);
  const diagrams = join(out, 'docs', 'diagrams');
  const stamp = join(cache, `${pin}.ok`);
  if (existsSync(stamp) && existsSync(diagrams)) return diagrams;

  mkdirSync(cache, { recursive: true });
  const repo = join(cache, 'repo');
  if (existsSync(join(repo, '.git'))) {
    git(
      ['fetch', '--quiet', '--filter=blob:none', 'origin', 'main:refs/remotes/origin/main'],
      repo,
    );
  } else {
    rmSync(repo, { recursive: true, force: true });
    git([
      'clone',
      '--quiet',
      '--filter=blob:none',
      '--no-checkout',
      '--single-branch',
      '--branch',
      'main',
      repoUrl,
      repo,
    ]);
  }
  if (!isAncestor(repo, pin, 'refs/remotes/origin/main')) {
    throw new Error(
      `library.lock pins ${pin}, which isn't on isoloop/isoloop's main. ` +
        'Pin a commit that has merged, so its diagrams passed the drift test (ADR 0002, decision 6).',
    );
  }
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  // Only docs/diagrams, written to its own folder; the clone's blobs come on demand.
  git(['--work-tree', out, 'checkout', pin, '--', 'docs/diagrams'], repo);
  writeFileSync(stamp, `${new Date().toISOString()}\n`);
  return diagrams;
}
