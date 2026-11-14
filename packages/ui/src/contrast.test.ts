// Contrast by test (ADR 0003, decision 8): every declared pair of semantic
// colours, in both themes, against WCAG 2.2 AA. A new semantic colour comes
// with its pairs here, in the same PR.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast, declarations, resolve } from './contrast.ts';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

/** The block that follows a marker comment, up to its closing brace. */
function blockAfter(marker: string): string {
  const at = css.indexOf(`/* ${marker}`);
  if (at < 0) throw new Error(`no /* ${marker} block in tokens.css`);
  const open = css.indexOf('{', css.indexOf('*/', at));
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unclosed block after ${marker}`);
}

const primitives = declarations(css.slice(0, css.indexOf('/* light')));
const themes = {
  light: declarations(blockAfter('light')),
  dark: declarations(blockAfter('dark */')),
};

/** [foreground, background, minimum]: 4.5 for text, 3 for control borders, focus and part colours. */
const PAIRS: [string, string, number][] = [
  ['ui-text', 'ui-bg', 4.5],
  ['ui-text', 'ui-surface', 4.5],
  ['ui-text-muted', 'ui-bg', 4.5],
  ['ui-accent', 'ui-bg', 4.5],
  ['ui-on-accent', 'ui-accent', 4.5],
  ['ui-border', 'ui-bg', 3],
  ['ui-border', 'ui-surface', 3],
  ['ui-focus', 'ui-bg', 3],
  ['ui-bad', 'ui-bg', 4.5],
  ['ui-bad', 'ui-surface', 4.5],
  // The part colours mark tracks, bars and headings, always next to a name in text.
  ['ui-part-host', 'ui-bg', 3],
  ['ui-part-host', 'ui-surface', 3],
  ['ui-part-bus', 'ui-bg', 3],
  ['ui-part-bus', 'ui-surface', 3],
  ['ui-part-isolate', 'ui-bg', 3],
  ['ui-part-isolate', 'ui-surface', 3],
  ['ui-part-pool', 'ui-bg', 3],
  ['ui-part-pool', 'ui-surface', 3],
  // --ui-rule is decorative (rules, grid lines) and has no minimum.
];

function colour(semantic: Map<string, string>, n: string): string {
  const v = semantic.get(n);
  if (v === undefined) throw new Error(`--${n} isn't declared in this theme`);
  return resolve(v, [semantic, primitives]);
}

describe.each(Object.entries(themes))('the %s theme', (_name, semantic) => {
  it.each(PAIRS)('--%s on --%s is at least %d:1', (fg, bg, min) => {
    expect(contrast(colour(semantic, fg), colour(semantic, bg))).toBeGreaterThanOrEqual(min);
  });
});

it('the no-JS dark block matches the dark block', () => {
  const media = declarations(blockAfter('dark, without JS'));
  expect([...media]).toEqual([...themes.dark]);
});

it('converts the extremes as WCAG expects', () => {
  expect(contrast('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 1);
  expect(contrast('oklch(0.5 0 0)', 'oklch(0.5 0 0)')).toBe(1);
});
