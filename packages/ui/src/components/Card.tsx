/** @jsxImportSource preact */
import type { ComponentChildren, VNode } from 'preact';

export interface CardProps {
  title: string;
  /** Heading level inside the page's outline. */
  level?: 2 | 3;
  /** A screenshot or figure above the text: root-absolute src, and its text alternative. */
  image?: { src: string; alt: string; width: number; height: number };
  children?: ComponentChildren;
}

/** A card: an example, a figure or a short section (ADR 0003, decision 6). */
export function Card({ title, level = 3, image, children }: CardProps): VNode {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <article class="ui-card">
      {image ? (
        <img
          class="ui-card-image"
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
        />
      ) : null}
      <H>{title}</H>
      {children}
    </article>
  );
}
