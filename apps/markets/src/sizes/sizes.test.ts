import { describe, expect, it } from 'vitest';
import { CATEGORY } from './categories';
import { countByCategory, sizeHref, sizeOf, SPECS, specFrom } from './sizes';

describe('sizes', () => {
  it('reads ?size=, with normal as the default', () => {
    expect(sizeOf(new URLSearchParams(''))).toBe('normal');
    expect(sizeOf(new URLSearchParams('size=lite'))).toBe('lite');
    expect(sizeOf(new URLSearchParams('size=heavy'))).toBe('heavy');
    expect(sizeOf(new URLSearchParams('size=huge'))).toBe('normal');
  });

  it('applies the test-only overrides', () => {
    const s = specFrom(new URLSearchParams('size=lite&symbols=5&widgets=price,trades'));
    expect(s.size).toBe('lite');
    expect(s.symbols).toBe(5);
    expect(s.widgets.map((p) => p.id)).toEqual(['price', 'trades']);
  });

  it('gives every placement a unique id and a category', () => {
    for (const spec of Object.values(SPECS)) {
      const ids = spec.widgets.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const p of spec.widgets) expect(CATEGORY[p.widget]).toBeDefined();
    }
  });

  it('lite is the M3b page: 6 widgets on 3 symbols', () => {
    expect(SPECS.lite.widgets).toHaveLength(6);
    expect(SPECS.lite.symbols).toBe(3);
    expect(countByCategory(SPECS.lite.widgets).get('aggregated/canvas')).toBe(2);
  });

  it('builds the URL for another size, dropping the replay position', () => {
    expect(sizeHref('heavy', '?size=lite&speed=10&at=500')).toBe('?size=heavy&speed=10');
  });
});
