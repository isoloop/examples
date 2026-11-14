// Builds the Isoloop marks (docs/brand.md) from the shapes in geometry.ts and
// the outlined wordmark in wordmark.ts. No dependencies:
//   pnpm --filter ui brand:marks
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWBOX, faces, openings, ribbon } from './geometry.ts';
import { WORDMARK } from './wordmark.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');

type Theme = 'light' | 'dark';
type Piece = keyof typeof ribbon;
type Part = 'top' | 'left' | 'right' | Piece;

/** Back to front: the chevron on the top face is in front of everything. */
const ORDER: Piece[] = ['lobe', 'bowl', 'arc', 'fold', 'chevron'];

// Gradient stops from the palette (ADR 0003, docs/brand.md). The flat version
// uses the second stop.
const PALETTES: Record<Theme, Record<Part, string[]> & { open: string }> = {
  light: {
    top: ['#8456ee', '#6a3fd0'],
    left: ['#33209a', '#20166e'],
    right: ['#2f57cc', '#1f3db4'],
    open: '#170f52',
    chevron: ['#5ff2e2', '#46cfd6'],
    arc: ['#4cc6d3', '#2f7fd8'],
    fold: ['#4cc6d3', '#3fb0dc'],
    bowl: ['#6e46c2', '#2f57cc', '#3fa6e6'],
    lobe: ['#2f62d4', '#3fb3e6'],
  },
  dark: {
    top: ['#a98bf2', '#8a6ad8'],
    left: ['#4a3aae', '#3a2f94'],
    right: ['#5f82f0', '#4566d8'],
    open: '#232a63',
    chevron: ['#7eeee5', '#4cc6d3'],
    arc: ['#5fd6df', '#5f9ef2'],
    fold: ['#5fd6df', '#62c3ea'],
    bowl: ['#b79af6', '#8aa5ff', '#62c3ea'],
    lobe: ['#6f92f5', '#62c9ec'],
  },
};

/** Gradient directions in the 1024 design space: x1, y1, x2, y2. */
const DIR: Record<Part, [number, number, number, number]> = {
  top: [163, 190, 861, 390],
  left: [163, 400, 512, 800],
  right: [512, 300, 861, 895],
  chevron: [861, 260, 400, 470],
  arc: [300, 300, 300, 640],
  fold: [258, 560, 412, 700],
  bowl: [190, 760, 612, 540],
  lobe: [612, 560, 700, 958],
};

const grad = (
  id: string,
  stops: string[],
  [x1, y1, x2, y2]: [number, number, number, number],
): string =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(
      (c, i) =>
        `<stop offset="${stops.length === 1 ? 0 : i / (stops.length - 1)}" stop-color="${c}"/>`,
    )
    .join('')}</linearGradient>`;

type MarkOptions = { theme?: Theme; flat?: boolean; mono?: boolean; id?: string };

/** The everyday mark: the cube with its woven ribbon. */
function everyday({
  theme = 'light',
  flat = false,
  mono = false,
  id = 'i',
}: MarkOptions = {}): string {
  if (mono) {
    // One colour: the faces at three strengths with the openings cut through,
    // the ribbon solid, and a 16-unit gap cut around each ribbon piece from
    // everything behind it, so the weave reads in one colour.
    const gap = (k: Piece): string =>
      `<path d="${ribbon[k]}" fill="#000" stroke="#000" stroke-width="32" stroke-linejoin="round"/>`;
    const mask = (name: string, body: string): string =>
      `<mask id="${id}-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024"><rect width="1024" height="1024" fill="#fff"/>${body}</mask>`;
    const masks = [
      mask(
        'f',
        openings.map((d) => `<path d="${d}" fill="#000"/>`).join('') + ORDER.map(gap).join(''),
      ),
      ...ORDER.map((k, i) =>
        mask(
          k,
          ORDER.slice(i + 1)
            .map(gap)
            .join(''),
        ),
      ),
    ];
    return [
      `<defs>${masks.join('')}</defs>`,
      `<g mask="url(#${id}-f)">`,
      `<path d="${faces.top}" fill="currentColor" opacity=".5"/>`,
      `<path d="${faces.left}" fill="currentColor" opacity=".85"/>`,
      `<path d="${faces.right}" fill="currentColor" opacity=".68"/>`,
      `</g>`,
      ...ORDER.map((k) => `<path d="${ribbon[k]}" fill="currentColor" mask="url(#${id}-${k})"/>`),
    ].join('');
  }
  const pal = PALETTES[theme];
  const parts: Part[] = ['top', 'left', 'right', ...ORDER];
  const defs = flat
    ? ''
    : `<defs>${parts.map((k) => grad(`${id}-${k}`, pal[k], DIR[k])).join('')}</defs>`;
  const fill = (k: Part): string =>
    flat ? (pal[k][1] ?? pal[k][0] ?? '#000') : `url(#${id}-${k})`;
  return [
    defs,
    `<path d="${faces.top}" fill="${fill('top')}"/>`,
    `<path d="${faces.left}" fill="${fill('left')}"/>`,
    `<path d="${faces.right}" fill="${fill('right')}"/>`,
    ...openings.map((d) => `<path d="${d}" fill="${pal.open}"/>`),
    ...ORDER.map((k) => `<path d="${ribbon[k]}" fill="${fill(k)}"/>`),
  ].join('');
}

const svg = (body: string, viewBox: string = VIEWBOX): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Isoloop">${body}</svg>\n`;

// The everyday mark's box in design space (VIEWBOX): x 82, y 62, 860 square.
const BOX = { x: 82, y: 62, s: 860 };
const placeMark = (body: string, x: number, y: number, size: number): string =>
  `<g transform="translate(${x} ${y}) scale(${size / BOX.s}) translate(${-BOX.x} ${-BOX.y})">${body}</g>`;

const RING: Record<Theme, string[]> = {
  light: ['#6e46c2', '#2f57cc', '#4cc6d3'],
  dark: ['#b79af6', '#8aa5ff', '#4cc6d3'],
};

const p = ([x, y]: [number, number]): string => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** The expressive mark: the cube and ribbon inside a cycle arrow with two heads. */
function expressive({ theme = 'light', id = 'x' }: MarkOptions = {}): string {
  const c = 512;
  const r = 372; // the ring's centre line
  const w = 76; // the ring's width
  const at = (deg: number, rad = r): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
  };
  // Two arcs, clockwise (angles grow clockwise with y down), each ending in a head.
  const arc = (from: number, to: number): string => `M${p(at(from))}A${r} ${r} 0 0 1 ${p(at(to))}`;
  const head = (deg: number): string => {
    const t = ((deg + 90) * Math.PI) / 180; // the clockwise tangent
    const [bx, by] = at(deg);
    const tip: [number, number] = [bx + 104 * Math.cos(t), by + 104 * Math.sin(t)];
    return `M${p(at(deg, r + 84))}L${p(tip)}L${p(at(deg, r - 84))}Z`;
  };
  const ring = grad(`${id}-ring`, RING[theme], [110, 560, 914, 460]);
  return [
    `<defs>${ring}</defs>`,
    `<path d="${arc(190, 352)}" fill="none" stroke="url(#${id}-ring)" stroke-width="${w}"/>`,
    `<path d="${head(352)}" fill="url(#${id}-ring)"/>`,
    `<path d="${arc(10, 172)}" fill="none" stroke="url(#${id}-ring)" stroke-width="${w}"/>`,
    `<path d="${head(172)}" fill="url(#${id}-ring)"/>`,
    placeMark(everyday({ theme, id: `${id}-c` }), c - 330, c - 330, 660),
  ].join('');
}

// The wordmark, outlined (wordmark.ts), with its ascender at 56% of the mark's height.
const INK: Record<Theme, string> = { light: '#14161c', dark: '#e9ecf3' };
const wordmark = (theme: Theme, x: number, baseline: number, scale: number): string =>
  `<path transform="translate(${x} ${baseline - WORDMARK.ascent * scale}) scale(${scale})" d="${WORDMARK.d}" fill="${INK[theme]}"/>`;

const M = 860; // the mark's size in a lockup
const WSCALE = (0.56 * M) / WORDMARK.ascent;

function lockup(theme: Theme, id: string): string {
  const gap = M / 2;
  const width = M + gap + WORDMARK.width * WSCALE;
  const baseline = M / 2 + (WORDMARK.ascent * WSCALE) / 2;
  return svg(
    placeMark(everyday({ theme, id }), 0, 0, M) + wordmark(theme, M + gap, baseline, WSCALE),
    `0 0 ${width.toFixed(0)} ${M}`,
  );
}

function stacked(theme: Theme, id: string): string {
  const tw = WORDMARK.width * WSCALE;
  const width = Math.max(M, tw);
  const baseline = M + 120 + WORDMARK.ascent * WSCALE;
  const height = baseline + WORDMARK.descent * WSCALE;
  return svg(
    placeMark(everyday({ theme, id }), (width - M) / 2, 0, M) +
      wordmark(theme, (width - tw) / 2, baseline, WSCALE),
    `0 0 ${width.toFixed(0)} ${height.toFixed(0)}`,
  );
}

/** The app tile: the gradient square and the one-colour mark in white. */
function appTile(id: string, rx = 228): string {
  const bg = `<defs><linearGradient id="${id}-bg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3b2aa8"/><stop offset=".5" stop-color="#2f57cc"/><stop offset="1" stop-color="#2fb8c6"/></linearGradient></defs>`;
  return svg(
    `${bg}<rect width="1024" height="1024" rx="${rx}" fill="url(#${id}-bg)"/><g color="#ffffff">${placeMark(everyday({ mono: true, id }), 182, 182, 660)}</g>`,
    '0 0 1024 1024',
  );
}

const files: Record<string, string> = {
  'mark.svg': svg(everyday({ id: 'ml' })),
  'mark-dark.svg': svg(everyday({ theme: 'dark', id: 'md' })),
  'mark-flat.svg': svg(everyday({ flat: true, id: 'mf' })),
  'mark-mono.svg': svg(everyday({ mono: true, id: 'mm' })),
  'favicon.svg': svg(everyday({ flat: true, id: 'fv' })),
  'expressive.svg': svg(expressive({ id: 'el' }), '0 0 1024 1024'),
  'expressive-dark.svg': svg(expressive({ theme: 'dark', id: 'ed' }), '0 0 1024 1024'),
  'lockup.svg': lockup('light', 'll'),
  'lockup-dark.svg': lockup('dark', 'ld'),
  'lockup-stacked.svg': stacked('light', 'ls'),
  'app-tile.svg': appTile('at'),
  // Square: iOS masks the corners itself.
  'apple-touch-icon.svg': appTile('ai', 0),
};
for (const [name, body] of Object.entries(files)) writeFileSync(join(OUT, name), body);
console.log(Object.keys(files).join(' '));
