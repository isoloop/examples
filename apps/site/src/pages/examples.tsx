/** @jsxImportSource preact */
import type { VNode } from 'preact';
import type { Example } from '../../build/examples.ts';
import { examplesPage } from '../copy.ts';
import type { Page, SiteData } from './types.ts';

/** An example's links: live first, then source, results and architecture. */
export function ExampleLinks({ example }: { example: Example }): VNode {
  const { links } = example;
  const t = examplesPage.links;
  return (
    <p class="ui-links">
      <a href={links.live}>
        {t.live}
        <span class="visually-hidden">: {example.title}</span>
      </a>
      <a href={links.source}>
        {t.source}
        <span class="visually-hidden"> of {example.title}</span>
      </a>
      {links.results ? (
        <a href={links.results}>
          {t.results}
          <span class="visually-hidden"> of {example.title}</span>
        </a>
      ) : null}
      {links.architecture ? (
        <a href={links.architecture}>
          {t.architecture}
          <span class="visually-hidden"> of {example.title}</span>
        </a>
      ) : null}
    </p>
  );
}

/**
 * The examples as a list with rules (ADR 0003, as amended: no card grids):
 * the title, one line, the measured result with its tag (or a note where
 * none is published yet), the links, and on the hub the screenshot.
 */
export function ExampleList({
  examples,
  level,
  images,
}: {
  examples: Example[];
  level: 2 | 3;
  images: boolean;
}): VNode {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <ul class="ui-examples">
      {examples.map((e) => (
        <li key={e.id}>
          <H>
            <a href={e.links.live}>{e.title}</a>
          </H>
          <p>{e.summary}</p>
          {e.result ? (
            <p class="ui-result">
              {e.result.line}{' '}
              <span class="ui-tag">
                {examplesPage.measuredAt} <code>{e.result.tag}</code>
              </span>
            </p>
          ) : e.note ? (
            <p class="ui-result">{e.note}</p>
          ) : null}
          {images && e.image ? (
            <img
              src={e.image.src}
              alt={`${e.title}, a screenshot`}
              width={e.image.width}
              height={e.image.height}
              loading="lazy"
            />
          ) : null}
          <ExampleLinks example={e} />
        </li>
      ))}
    </ul>
  );
}

function Examples({ examples }: SiteData): VNode {
  return (
    <main class="ui-shell">
      <section class="ui-intro" aria-labelledby="title">
        <h1 id="title">{examplesPage.heading}</h1>
        <p class="ui-lede">{examplesPage.intro}</p>
      </section>
      <section class="ui-gutter" aria-label={examplesPage.heading}>
        <div class="ui-gutter-empty" aria-hidden="true" />
        <div class="ui-body">
          <ExampleList examples={examples} level={2} images />
          <p>
            <small>{examplesPage.support}</small>
          </p>
        </div>
      </section>
    </main>
  );
}

export const examplesHubPage: Page = {
  path: '/examples/',
  section: 'examples',
  head: { title: examplesPage.title, description: examplesPage.description },
  render: (data) => <Examples {...data} />,
};
