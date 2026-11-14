/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { Callout, Frame } from 'ui/components';
import { howItWorks } from '../copy.ts';
import { rich } from './rich.tsx';
import type { Page, SiteData } from './types.ts';

function HowItWorks({ diagrams, pin }: SiteData): VNode {
  return (
    <main class="ui-shell">
      <section class="ui-intro" aria-labelledby="title">
        <h1 id="title">{howItWorks.heading}</h1>
        <p class="ui-lede">{howItWorks.intro}</p>
        <p>
          <small>
            {howItWorks.pinned}{' '}
            <a href={`https://github.com/isoloop/isoloop/tree/${pin}/docs/diagrams`}>
              <code>{pin.slice(0, 7)}</code>
            </a>
          </small>
        </p>
      </section>
      {diagrams.map((d) => {
        const href = `/how-it-works/diagrams/${d.name}.html`;
        return (
          <section class="ui-gutter" aria-labelledby={d.name} key={d.name}>
            <h2 id={d.name}>{d.title}</h2>
            <div class="ui-body">
              <p>{rich(howItWorks.diagrams[d.name] ?? '')}</p>
              <Frame
                src={href}
                title={`Diagram: ${d.title}`}
                height={560}
                open={{ href, label: `${howItWorks.open}: ${d.title}` }}
              />
            </div>
          </section>
        );
      })}
      <section class="ui-gutter" aria-labelledby="policy">
        <h2 id="policy">{howItWorks.policy.heading}</h2>
        <div class="ui-body">
          <Callout>
            <p>{howItWorks.policy.text}</p>
            <p>
              <a href="https://github.com/isoloop/isoloop/blob/main/docs/guide/hosting.md">
                {howItWorks.policy.link}
              </a>
            </p>
          </Callout>
        </div>
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
