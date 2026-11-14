/** @jsxImportSource preact */
// The conformance suite for render() (ADR 0003, decision 2): what any renderer
// behind it has to produce. If a swap changes one of these strings, it changed
// the pages.
import { describe, expect, it } from 'vitest';
import { render } from './render.ts';

describe('render()', () => {
  it('escapes text', () => {
    expect(render(<p>{'<script>alert("x")</script> & co'}</p>)).toBe(
      '<p>&lt;script>alert(&quot;x&quot;)&lt;/script> &amp; co</p>',
    );
  });

  it('escapes attribute values', () => {
    expect(render(<a href={'/a?b=1&c="2"'}>x</a>)).toBe(
      '<a href="/a?b=1&amp;c=&quot;2&quot;">x</a>',
    );
  });

  it('writes boolean attributes bare, and drops false ones', () => {
    expect(render(<button hidden disabled={false} type="button" />)).toBe(
      '<button hidden type="button"></button>',
    );
  });

  it('keeps aria and data attributes as given', () => {
    expect(render(<a aria-current="page" data-x="1" />)).toBe(
      '<a aria-current="page" data-x="1"></a>',
    );
  });

  it('writes `class`, not `className`', () => {
    expect(render(<div class="ui-card" />)).toBe('<div class="ui-card"></div>');
  });

  it('closes no void element', () => {
    expect(
      render(
        <p>
          a<br />b
        </p>,
      ),
    ).toBe('<p>a<br/>b</p>');
  });

  it('renders fragments and arrays without wrappers', () => {
    expect(
      render(
        <>
          {['a', 'b'].map((x) => (
            <i key={x}>{x}</i>
          ))}
        </>,
      ),
    ).toBe('<i>a</i><i>b</i>');
  });

  it('leaves out null, undefined and false children', () => {
    expect(
      render(
        <p>
          {null}
          {undefined}
          {false}x
        </p>,
      ),
    ).toBe('<p>x</p>');
  });

  it('adds no hydration markers', () => {
    expect(render(<main>x</main>)).not.toMatch(/<!--/);
  });
});
