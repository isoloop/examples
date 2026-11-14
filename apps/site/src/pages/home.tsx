/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { Button, Card, Frame, Table } from 'ui/components';
import { COPY_STATUS, home, site } from '../copy.ts';
import type { Page, SiteData } from './types.ts';
import { ExampleLinks } from './examples.tsx';

const PLANT = '/examples/dashboards/plant/';
const PLANT_SOURCE = 'https://github.com/isoloop/web/tree/main/apps/dashboards/plant';

function Home({ examples, diagrams }: SiteData): VNode {
  const topology = diagrams[0];
  return (
    <main class="ui-shell" data-copy={COPY_STATUS}>
      <section class="ui-hero" aria-labelledby="hero">
        <h1 id="hero">{home.hero.heading}</h1>
        <ul>
          {home.hero.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div class="ui-actions">
          <Button href={PLANT} primary>
            {home.hero.primary}
          </Button>
          <a href="/how-it-works/">{home.hero.secondary}</a>
          <a href="https://github.com/isoloop/isoloop">GitHub</a>
        </div>
      </section>

      <section class="ui-section" aria-labelledby="demo">
        <h2 id="demo">{home.demo.heading}</h2>
        <p>{home.demo.text}</p>
        <Frame
          src="/examples/basic/?embed=1"
          title={home.demo.frameTitle}
          height={640}
          open={{ href: '/examples/basic/', label: home.demo.open }}
        />
      </section>

      <section class="ui-section" aria-labelledby="gives">
        <h2 id="gives">{home.gives.heading}</h2>
        <Table caption={home.gives.caption} head={home.gives.head} rows={home.gives.rows} />
        <p>
          <a href={`${PLANT_SOURCE}#what-each-build-does-when-something-goes-wrong`}>
            {home.gives.more}
          </a>
        </p>
      </section>

      <section class="ui-section" aria-labelledby="costs">
        <h2 id="costs">{home.costs.heading}</h2>
        <Table caption={home.costs.caption} head={home.costs.head} rows={home.costs.rows} />
        <p>
          <a href={`${PLANT_SOURCE}/comparison`}>{home.costs.more}</a>
        </p>
      </section>

      <section class="ui-section" aria-labelledby="limits">
        <h2 id="limits">{home.limits.heading}</h2>
        <ul>
          {home.limits.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      <section class="ui-section" aria-labelledby="topology">
        <h2 id="topology">{home.topology.heading}</h2>
        <p>{home.topology.text}</p>
        {topology ? (
          <Frame
            src={`/how-it-works/diagrams/${topology.name}.html`}
            title={home.topology.frameTitle}
            height={560}
            open={{ href: '/how-it-works/', label: home.topology.link }}
          />
        ) : null}
      </section>

      <section class="ui-section" aria-labelledby="examples">
        <h2 id="examples">{home.examples.heading}</h2>
        <div class="ui-grid">
          {examples.map((e) => (
            <Card key={e.id} title={e.title}>
              <p>{e.summary}</p>
              <ExampleLinks example={e} />
            </Card>
          ))}
        </div>
        <p>
          <a href="/examples/">{home.examples.all}</a>
        </p>
      </section>

      <section class="ui-section" aria-labelledby="install">
        <h2 id="install">{home.install.heading}</h2>
        <p>{home.install.label}</p>
        <pre class="ui-code">
          <code>{home.install.command}</code>
        </pre>
        <p>
          <a href="https://github.com/isoloop/isoloop/blob/main/docs/guide/hosting.md">
            {home.install.guide}
          </a>
        </p>
      </section>
    </main>
  );
}

export const homePage: Page = {
  path: '/',
  section: 'home',
  head: { title: home.title, description: site.description, home: true },
  render: (data) => <Home {...data} />,
};
