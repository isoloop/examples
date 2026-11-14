# ui

The design system shared by the site and the examples ([ADR 0003](../../docs/adr/0003-design-system.md)). Private, with no version: every app uses it from the workspace.

| Export | What it is |
| --- | --- |
| `ui/components` | `Header`, `Bar`, `Footer`, `ThemeToggle`: Preact, rendered to static HTML at build time only |
| `ui/render` | `render(node): string`, the only file that imports `preact-render-to-string`; `render.test.tsx` is its conformance suite |
| `ui/tokens.css` | the `--ui-*` tokens: primitives, and the semantic layer per theme |
| `ui/shell.css` | the `ui-` classes, in `@layer ui` |
| `ui/theme.js` | the theme script ([ADR 0002](../../docs/adr/0002-site-build.md), decision 8), plus `?embed=1` → `<html data-embed>` |
| `ui/vite` | `ui({ header, bar, footer })`: injects the CSS, `theme.js` and the rendered partials into an app's pages |

`src/base.css` holds the element rules (`body`, links, focus). Only pages with the full header get it, so the dashboards' bar adds no global styles.

## Using it

```ts
// vite.config.ts
import { ui } from 'ui/vite';
export default defineConfig({ plugins: [ui({ header: { current: 'examples' }, footer: true })] });
```

An app that imports `ui/vite` runs Vite with `--configLoader runner` (in its `dev`, `build` and `preview` scripts). Vite's default config loader hands a linked workspace package to Node, and Node can't load the components' `.tsx`. The runner transforms them as it loads them. Its `tsconfig.json` also needs `"jsx": "react-jsx"` and `"jsxImportSource": "preact"`, so `tsc` can follow the import.

Put `<!-- ui:header -->`, `<!-- ui:bar -->` or `<!-- ui:footer -->` in a page to choose where a partial goes. Otherwise the header and bar go first in `<body>` and the footer last.

## Checks

- `contrast.test.ts`: every declared pair of semantic colours, in both themes, against WCAG AA. A new semantic colour comes with its pairs.
- `render.test.tsx`: what any renderer behind `render()` must produce.
- `vite.test.ts`: the plugin's files, partials and paths.
- `pnpm --filter ui dev` serves the specimens page, and `build:specimens` builds it for the site's accessibility check.

The token values are neutral placeholders until the design pick (plan task 7b).
