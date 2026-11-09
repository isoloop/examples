import { describe, expect, it } from 'vitest';
import { buildHref, settingsFrom, withParam } from './url';

describe('settingsFrom', () => {
  it('defaults to 1 kHz, split placement, seed 1', () => {
    expect(settingsFrom(new URLSearchParams(''))).toEqual({
      rate: 1,
      placement: 'split',
      seed: 1,
    });
  });
  it('reads the rate, the placement and the seed', () => {
    expect(settingsFrom(new URLSearchParams('rate=5&placement=own&seed=7'))).toEqual({
      rate: 5,
      placement: 'own',
      seed: 7,
    });
  });
  it('ignores values it does not know', () => {
    expect(settingsFrom(new URLSearchParams('rate=3&placement=x&seed=-1'))).toEqual({
      rate: 1,
      placement: 'split',
      seed: 1,
    });
  });
});

describe('hrefs', () => {
  it('keeps the other parameters', () => {
    expect(withParam('?rate=2&seed=3', 'placement', 'machine')).toBe(
      '?rate=2&seed=3&placement=machine',
    );
    expect(buildHref('native', '?rate=2')).toBe('../native/?rate=2');
  });
});
