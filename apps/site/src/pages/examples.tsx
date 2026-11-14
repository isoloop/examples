/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { Card } from 'ui/components';
import type { Example } from '../../build/examples.ts';
import { examplesPage } from '../copy.ts';
import type { Page, SiteData } from './types.ts';

/** An example's links: live first, then source, results and architecture. */
export function ExampleLinks({ example }: { example: Example }): VNode {
  const { links } = example;
  const t = examplesPage.links;
  return (
    <p class="ui-actions">
      <a class="ui-button" data-primary href={links.live}>
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

function Examples({ examples }: SiteData): VNode {
  return (
    <main class="ui-shell">
      <section class="ui-section" aria-labelledby="title">
        <h1 id="title">{examplesPage.heading}</h1>
        <p>{examplesPage.intro}</p>
        <div class="ui-grid">
          {examples.map((e) => (
            <Card
              key={e.id}
              title={e.title}
              level={2}
              {...(e.image
                ? {
                    image: {
                      src: e.image.src,
                      alt: `${e.title}, a screenshot`,
                      width: e.image.width,
                      height: e.image.height,
                    },
                  }
                : {})}
            >
              <p>{e.summary}</p>
              {e.result ? (
                <p>
                  {e.result.line}{' '}
                  <small>
                    ({examplesPage.measuredAt} <code>{e.result.tag}</code>)
                  </small>
                </p>
              ) : null}
              <ExampleLinks example={e} />
            </Card>
          ))}
        </div>
        <p>
          <small>{examplesPage.support}</small>
        </p>
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
