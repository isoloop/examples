/** @jsxImportSource preact */
import type { ComponentChildren, VNode } from 'preact';
import { Table } from 'ui/components';
import { features, featuresPage as f, home } from '../copy.ts';
import { Recording } from './recording.tsx';
import { rich } from './rich.tsx';
import type { Page, SiteData } from './types.ts';

const PLANT_RESULTS = 'https://github.com/isoloop/web/tree/main/apps/dashboards/plant/comparison';
const POOLS_GUIDE = 'https://github.com/isoloop/isoloop/blob/main/docs/guide/pools.md';
const HOSTING_GUIDE = 'https://github.com/isoloop/isoloop/blob/main/docs/guide/hosting.md';

/** A feature's section: its heading in the gutter, with the bar of its part of the system. */
function Feature({ id, children }: { id: string; children: ComponentChildren }): VNode {
  const feature = features.find((x) => x.id === id);
  if (!feature) throw new Error(`no feature "${id}" in copy.ts`);
  return (
    <section class="ui-gutter" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} data-part={feature.part}>
        {feature.name.replace(/\.$/, '')}
      </h2>
      <div class="ui-body">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }): VNode {
  return (
    <pre class="ui-code">
      <code>{children}</code>
    </pre>
  );
}

function Features({ samples }: SiteData): VNode {
  return (
    <main class="ui-shell">
      <section class="ui-intro" aria-labelledby="title">
        <h1 id="title">{f.heading}</h1>
        <p class="ui-lede">{f.lede}</p>
        <nav class="ui-strip" aria-label="Features">
          <ul>
            {features.map((x) => (
              <li key={x.id} data-part={x.part}>
                <a href={`#${x.id}`}>
                  <b>{x.name}</b> {x.line}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <Feature id="containment">
        <p>{f.containment.text}</p>
        <Recording
          id="containment-rec"
          tracks={['main', 'A', 'B', 'pool']}
          controls={['block-c', 'crash-a']}
          caption={<>{f.containment.caption}</>}
        />
      </Feature>

      <Feature id="restart">
        {f.restart.text.map((t) => (
          <p key={t}>{rich(t)}</p>
        ))}
        <figure class="still" aria-labelledby="restart-cap">
          <div class="still-row" aria-hidden="true">
            <span class="still-label">{f.restart.rows.loop}</span>
            <div class="loop-line">
              <i class="tick" />
              <i class="tick" />
              <i class="tick" />
              <i class="tick" />
              <span class="stuck">
                <b>{f.restart.stuck}</b>
              </span>
              <span class="again">{f.restart.again}</span>
              <i class="tick" />
              <i class="tick" />
              <i class="tick" />
              <i class="tick" />
            </div>
          </div>
          <div class="still-row" aria-hidden="true">
            <span class="still-label">{f.restart.rows.reads}</span>
            <ol class="cells">
              <li>4134</li>
              <li>4135</li>
              <li>4136</li>
              <li class="commit">4137</li>
              <li class="read-again">4138</li>
              <li class="read-again">4139</li>
              <li class="fresh">4140</li>
              <li class="fresh">4141</li>
              <li class="fresh">4142</li>
            </ol>
          </div>
          <ul class="still-key" aria-hidden="true">
            <li class="k-commit">{f.restart.key.commit}</li>
            <li class="k-again">{f.restart.key.again}</li>
            <li class="k-fresh">{f.restart.key.fresh}</li>
          </ul>
          <figcaption id="restart-cap">{rich(f.restart.caption)}</figcaption>
        </figure>
      </Feature>

      <Feature id="bus">
        <p>{rich(f.bus.text)}</p>
        <figure class="demo" data-demo="bus" aria-labelledby="bus-cap">
          <div class="topics" aria-hidden="true">
            {f.bus.topics.map(([name, from]) => (
              <div class="topic" data-topic={name} key={name}>
                <p class="topic-name">
                  {name} <span>{from}</span>
                </p>
                <ol class="recs" />
                <p class="readers" />
              </div>
            ))}
          </div>
          <p class="ui-status" role="status" aria-live="polite">
            {f.bus.status}
          </p>
          <figcaption id="bus-cap">{f.bus.caption}</figcaption>
        </figure>
        <Code>{samples.contracts}</Code>
      </Feature>

      <Feature id="replay">
        <p>{rich(f.replay.text)}</p>
        <figure class="demo" data-demo="replay" aria-labelledby="replay-cap">
          <div class="tape" aria-hidden="true">
            <p class="tape-name">{f.replay.tape}</p>
            <ol class="tape-cells" />
          </div>
          <div class="ui-controls" role="group" aria-label="Try replay">
            <button type="button" class="ui-button" data-strong data-act="crash-d" disabled>
              {f.replay.crashD}
            </button>
            <p class="ui-status" role="status" aria-live="polite">
              {f.replay.status.reading}
            </p>
          </div>
          <figcaption id="replay-cap">{f.replay.caption}</figcaption>
        </figure>
      </Feature>

      <Feature id="durable">
        <p>{rich(f.durable.text)}</p>
        <figure class="still" aria-labelledby="durable-cap">
          <div class="ui-table-wrap">
            <table class="ui-table reload">
              <thead>
                <tr>
                  {f.durable.head.map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <code>count.v1</code>
                    <br />
                    <span>memory</span>
                  </th>
                  <td>
                    <span class="r">4131</span>
                    <span class="r">4132</span>
                    <span class="r">4133</span>
                    <span class="r">4134</span>
                  </td>
                  <td class="empty">empty</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code>alarms.v1</code>
                    <br />
                    <span>persistent</span>
                  </th>
                  <td>
                    <span class="r">212</span>
                    <span class="r">213</span>
                    <span class="r">214</span>
                    <span class="r">215</span>
                  </td>
                  <td>
                    <span class="r">212</span>
                    <span class="r">213</span>
                    <span class="r">214</span>
                    <span class="r">215</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <figcaption id="durable-cap">{rich(f.durable.caption)}</figcaption>
        </figure>
        <Code>{samples.durable}</Code>
      </Feature>

      <Feature id="placement">
        <p>{f.placement.text}</p>
        <figure class="still layouts" aria-labelledby="placement-cap">
          {f.placement.layouts.map(([name, loops, lanes]) => (
            <div class="layout" key={name}>
              <p class="layout-name">
                {name} <span>{loops}</span>
              </p>
              <div class="lanes">
                {lanes.map(([label, hit]) => (
                  <span class={hit ? 'lane hit' : 'lane'} key={label}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <figcaption id="placement-cap">{f.placement.caption}</figcaption>
        </figure>
        <Code>{samples.placement}</Code>
        <p>
          <a href={POOLS_GUIDE}>{f.placement.more}</a>
        </p>
      </Feature>

      <Feature id="frameworks">
        <p>{f.frameworks.text}</p>
        <div class="tabs" data-tabs>
          <div role="tablist" aria-label="Framework" hidden>
            {f.frameworks.tabs.map(([key, label], i) => (
              <button
                key={key}
                role="tab"
                type="button"
                id={`tab-${key}`}
                aria-controls={`panel-${key}`}
                aria-selected={i === 0 ? 'true' : 'false'}
                tabindex={i === 0 ? 0 : -1}
              >
                {label}
              </button>
            ))}
          </div>
          {f.frameworks.tabs.map(([key, label]) => (
            <div key={key} role="tabpanel" id={`panel-${key}`} aria-labelledby={`tab-${key}`}>
              <p class="tab-title">{label}</p>
              <Code>
                {key === 'react'
                  ? samples.react
                  : key === 'preact'
                    ? samples.preact
                    : samples.vanilla}
              </Code>
            </div>
          ))}
        </div>
      </Feature>

      <Feature id="safety">
        <dl class="facts">
          {f.safety.facts.map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>
                {rich(text)}
                {term === 'No inline code' ? (
                  <>
                    {' '}
                    <a href={HOSTING_GUIDE}>The hosting guide</a> has the full policy.
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        <Code>{samples.grants}</Code>
      </Feature>

      <Feature id="cost">
        <p>{f.cost.text}</p>
        <Table caption={home.costs.caption} head={home.costs.head} rows={home.costs.rows} />
        <p>
          <a href={PLANT_RESULTS}>{f.cost.more}</a>
        </p>
      </Feature>
    </main>
  );
}

export const featuresPage: Page = {
  path: '/features/',
  section: 'features',
  head: { title: f.title, description: f.description },
  scripts: ['/src/demos/features.ts'],
  render: (data) => <Features {...data} />,
};
