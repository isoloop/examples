import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadSamples, shown } from './samples.ts';

describe('shown', () => {
  it('keeps only the region marked to show', () => {
    const src =
      "import x from 'y';\n\n// #region show\nconst a = 1;\n  a;\n// #endregion\nexport {};\n";
    expect(shown(src)).toBe('const a = 1;\n  a;');
  });

  it('shows a whole file without its JSX pragma', () => {
    expect(shown('/** @jsxImportSource preact */\nimport a from "b";\n\nexport default a;\n')).toBe(
      'import a from "b";\n\nexport default a;',
    );
  });

  it('refuses a region that never ends', () => {
    expect(() => shown('// #region show\nconst a = 1;\n')).toThrow(/#endregion/);
  });
});

it('reads every sample the features page shows', () => {
  const samples = loadSamples(fileURLToPath(new URL('../../samples/src', import.meta.url)));
  expect(samples.contracts).toContain("topic('note.v1'");
  expect(samples.react).toContain("from '@isoloop/react'");
  expect(samples.preact).not.toContain('@jsxImportSource');
  expect(samples.placement).toContain("pool: 'shared'");
  expect(samples.placement).not.toContain('declare const');
});
