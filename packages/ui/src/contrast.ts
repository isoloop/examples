// WCAG contrast for the tokens (ADR 0003, decision 8): our own oklch → sRGB
// conversion (Björn Ottosson's OKLab matrices) and the WCAG 2.2 formula, so
// the check needs no colour library.

/** An `oklch(L C H)` colour; L as a number (0–1) or a percentage. */
export function parseOklch(value: string): [number, number, number] {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!m || m[1] === undefined || m[2] === undefined || m[3] === undefined)
    throw new Error(`not an oklch() colour: ${value}`);
  const l = m[1].endsWith('%') ? Number(m[1].slice(0, -1)) / 100 : Number(m[1]);
  return [l, Number(m[2]), Number(m[3])];
}

const clamp = (x: number): number => Math.min(1, Math.max(0, x));

/** Linear-light sRGB, each channel clamped to the gamut. */
export function oklchToLinearSrgb([l, c, h]: [number, number, number]): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp(4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1),
    clamp(-1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1),
    clamp(-0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1),
  ];
}

/** WCAG relative luminance, from linear-light sRGB. */
export function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two oklch colours, 1–21. */
export function contrast(a: string, b: string): number {
  const ya = luminance(oklchToLinearSrgb(parseOklch(a)));
  const yb = luminance(oklchToLinearSrgb(parseOklch(b)));
  return (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
}

/** The custom properties declared in one CSS block, by name without `--`. */
export function declarations(block: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g))
    if (m[1] !== undefined && m[2] !== undefined) out.set(m[1], m[2].trim());
  return out;
}

/** Follows `var(--x)` references until a value that isn't one. */
export function resolve(value: string, scopes: Map<string, string>[]): string {
  let v = value;
  for (let i = 0; i < 10; i++) {
    const m = /^var\(--([\w-]+)\)$/.exec(v);
    if (!m || m[1] === undefined) return v;
    const name = m[1];
    const next = scopes.map((s) => s.get(name)).find((x) => x !== undefined);
    if (next === undefined) throw new Error(`--${name} isn't declared`);
    v = next;
  }
  throw new Error(`var() loop resolving ${value}`);
}
