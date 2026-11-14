/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { Callout, Frame } from 'ui/components';
import { COPY_STATUS, howItWorks } from '../copy.ts';
import type { Page, SiteData } from './types.ts';

function HowItWorks({ diagrams, pin }: SiteData): VNode {
  return (
    <main class="ui-shell" data-copy={COPY_STATUS}>
      <section class="ui-section" aria-labelledby="title">
        <h1 id="title">{howItWorks.heading}</h1>
        <p>{howItWorks.intro}</p>
        <p>
          <small>
            {howItWorks.pinned}{' '}
            <a href={`https://github.com/isoloop/isoloop/tree/${pin}/docs/diagrams`}>
              <code>{pin.slice(0, 7)}</code>
            </a>
          </small>
        </p>
      </section>
      {diagrams.map((d, i) => {
        const href = `/how-it-works/diagrams/${d.name}.html`;
        return (
          <section class="ui-section" aria-labelledby={d.name} key={d.name}>
            <h2 id={d.name}>
              {i + 1}. {d.title}
            </h2>
            <p>{howItWorks.diagrams[d.name] ?? ''}</p>
            <Frame
              src={href}
              title={`Diagram: ${d.title}`}
              height={560}
              open={{ href, label: `${howItWorks.open}: ${d.title}` }}
            />
          </section>
        );
      })}
      <section class="ui-section" aria-labelledby="policy">
        <h2 id="policy">{howItWorks.policy.heading}</h2>
        <Callout>
          <p>{howItWorks.policy.text}</p>
          <p>
            <a href="https://github.com/isoloop/isoloop/blob/main/docs/guide/hosting.md">
              {howItWorks.policy.link}
            </a>
          </p>
        </Callout>
      </section>
    </main>
  );
}

export const howItWorksPage: Page = {
  path: '/how-it-works/',
  section: 'how-it-works',
  head: { title: howItWorks.title, description: howItWorks.description },
  render: (data) => <HowItWorks {...data} />,
};
