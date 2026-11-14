/** @jsxImportSource preact */
import type { ComponentChildren, VNode } from 'preact';

export interface ButtonProps {
  /** A link styled as a button: the site has no JS behaviour behind its buttons. */
  href: string;
  primary?: boolean;
  children?: ComponentChildren;
}

/** A call to action, as a link (ADR 0003, decision 6). */
export function Button({ href, primary = false, children }: ButtonProps): VNode {
  return (
    <a class="ui-button" href={href} data-primary={primary ? '' : undefined}>
      {children}
    </a>
  );
}
