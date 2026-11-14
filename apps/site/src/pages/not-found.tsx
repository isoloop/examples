/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { COPY_STATUS, notFound } from '../copy.ts';
import type { Page } from './types.ts';

function NotFound(): VNode {
  return (
    <main class="ui-shell" data-copy={COPY_STATUS}>
      <section class="ui-section" aria-labelledby="title">
        <h1 id="title">{notFound.heading}</h1>
        <p>{notFound.text}</p>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/how-it-works/">How it works</a>
          </li>
          <li>
            <a href="/examples/">Examples</a>
          </li>
        </ul>
      </section>
    </main>
  );
}

export const notFoundPage: Page = {
  path: '/404.html',
  head: { title: notFound.title, description: notFound.description },
  render: () => <NotFound />,
};
