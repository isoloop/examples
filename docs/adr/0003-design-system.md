# ADR 0003: The design system, `packages/ui`

- **Status:** Accepted
- **Date:** 2026-11-14
- **Answers:** what the site and the examples share so they read as one site, how it's built, and how it changes. Grilled 2026-11-14. Amends [ADR 0002](0002-site-build.md), decision 1.

## Context

[ADR 0001](0001-what-this-repo-is.md) puts the site and the examples in one repo so they can share one design system without copies. [ADR 0002](0002-site-build.md) settled the site's build and its rules: no framework code in the browser, `default-src 'self'`, every request same-origin, WCAG 2.2 AA, and the theme in `localStorage`.

The forces:

- **One site.** The landing page, the hub and basic must look like the same site. The dashboards keep their own look, but share a way back.
- **Markup is reused, and much of it comes from data.** Header, footer and page head tags appear on every page. Cards, tables and links are generated from `example.json` and the device table. Hand-written string templates leave escaping and typos to us.
- **The pages are static.** Nothing outside basic has state, and basic is its own app in an iframe. A visitor's browser should get HTML and CSS, not a framework.
- **The dashboards are different.** They're dark-only, dense, and built with React or Preact. Their own CSS mustn't fight a shared stylesheet, and their builds mustn't change.
- **Accessibility is AA** (ADR 0002, decision 9). Contrast has to hold in both themes, by test, not by eye.
- **The look isn't chosen yet.** The logo comes first (the user's idea: "Isol∞p", the "oo" as an infinity sign), then two or three design directions to pick from. This ADR fixes the structure. The values come from that pick.
- **Own the stack.** A dependency only where it clearly saves effort, kept behind something we own.

## Decision

### 1. The package

A private workspace package, `ui`, in `packages/ui`. It isn't published and has no version (decision 11).

| Export | What it is |
| --- | --- |
| `ui/components` | `Head`, `Header`, `Bar`, `Footer`, `Card`, `Table`, `Callout`, `Frame`, `Button`, `ThemeToggle`: Preact `.tsx` |
| `ui/render` | `render(node): string`, the only file that imports `preact-render-to-string` |
| `ui/tokens.css` | the design tokens (decision 3) |
| `ui/shell.css` | the `ui-` classes, in `@layer ui` (decision 6) |
| `ui/theme.js` | the classic theme script (decision 4) |
| `ui/vite` | the Vite plugin: renders components into pages, and injects the CSS, `theme.js`, the favicon and the bar |
| `ui/brand/` | the logo files (decision 10) |

### 2. Components: Preact at build time only

- **Rendered at build time.** Components are Preact `.tsx`, rendered to static HTML when the site and the examples build. No Preact or other framework JS reaches a page. The pages work without JS, as ADR 0002 requires.
- **One function renders everything:** `render(node): string`. Swapping `preact-render-to-string` changes one file, and a conformance test on `render()`'s output (escaping, attributes, void elements, fragments) checks a swap changed nothing.
- **Typed props.** Data comes in as props, so `tsc` catches a wrong field. Preact escapes every string.
- **Raw HTML is banned** by an oxlint rule on `dangerouslySetInnerHTML` in `packages/ui` and `apps/site`, apart from one allow-listed file M4's docs rendering will add.
- **A specimens page,** `packages/ui/specimens.html`, renders every component with sample props in both themes. It's served in dev, and the site's smoke test runs `expectAccessible` on it, so a component is checked before any page uses it.

### 3. Tokens

- **Written in CSS,** in `tokens.css`, as the single source. No token build step and no JSON source.
- **Prefixed `--ui-`,** so they can't collide with an app's own custom properties.
- **Two layers:**
  - **Primitives:** a neutral scale and one accent scale, `--ui-gray-1…12` and `--ui-accent-1…12`.
  - **Semantic tokens,** the only ones components use:

    | Group | Tokens |
    | --- | --- |
    | Colour | `--ui-bg`, `--ui-surface`, `--ui-text`, `--ui-text-muted`, `--ui-border`, `--ui-accent`, `--ui-on-accent`, `--ui-focus` |
    | Space | `--ui-space-1…8` |
    | Radius | `--ui-radius-s`, `-m`, `-l` |
    | Type | `--ui-font-sans`, `--ui-font-mono`, `--ui-text-xs…3xl` |
- **Themes switch only the semantic layer** (decision 4).
- **Colours are written in `oklch()`.** It's Baseline widely available, and even lightness steps make the scales easy to tune.
- **The values come from the design pick** (plan step 7b). Until then `tokens.css` holds neutral placeholders that pass the contrast test.

### 4. Themes

- **Two themes, light and dark,** selected by `<html data-theme>`. They follow the system until the visitor picks one.
- **`theme.js`** is the script specified in ADR 0002, decision 8:
  - a classic, same-origin file in `<head>`
  - before first paint, it applies `localStorage['isoloop-theme']`, or the system setting
  - it switches live on `storage` events and system changes, with every storage access guarded
  - `?theme=` overrides the stored value, for screenshots and tests
  - on a copied Archify diagram, it also keeps `archify-theme` in step
- **`ThemeToggle`** is a plain `<button>` enhanced by `theme.js`. Without JS it's hidden, and the system theme applies.
- **`forced-colors` (Windows high contrast)** is respected: borders and focus rings use system colours there.
- **No other themes.**

### 5. Type

- **System font stacks** for sans and mono. No web font is loaded anywhere; the wordmark is an SVG (decision 10).
- **A type scale at a 1.25 ratio,** `--ui-text-xs…3xl`.
- **Headings scale with `clamp()`** between phone and desktop widths.

### 6. Classes and the cascade

- **About a dozen classes,** prefixed `ui-`: `ui-shell`, `ui-header`, `ui-bar`, `ui-footer`, `ui-hero`, `ui-section`, `ui-card`, `ui-table`, `ui-code`, `ui-callout`, `ui-frame` (for iframes), `ui-button`, `ui-toggle`. Components render them; hand-written markup may use them too.
- **All of `shell.css` sits in `@layer ui`.** An app's own unlayered CSS always wins without specificity fights. That matters for the dashboards and basic.

### 7. Header and bar

| | `Header` (full) | `Bar` (thin) |
| --- | --- | --- |
| Where | the site, the hub, basic outside embed mode | the dashboards, injected into `index.html` by `ui({ bar: true })` |
| Holds | the wordmark, nav (Home, How it works, Examples, GitHub), `ThemeToggle` | "← Isoloop", How it works, Examples |
| Theme | follows the visitor's theme | fixed dark (`data-theme="dark"` on the bar itself), no `theme.js`, no toggle, so it matches its dark-only dashboard |

- **Links are root-absolute** (`/`, `/how-it-works/`, `/examples/`), since everything is served from the root of `isoloop.dev`. A dashboard run on its own with `vite dev` gets dead nav links; that's accepted.
- **`current` marks the page** with `aria-current="page"`.
- **Static HTML outside the app's root,** so it works the same in the dashboards' React and Preact builds and changes nothing in their bundles.
- **Basic in embed mode** (`?embed=1`, ADR 0002, decision 4) hides its `Header`.

### 8. Contrast, by test

- **Our own unit test** reads `tokens.css`, converts `oklch` to sRGB (about 30 lines), and checks each declared pair in both themes against WCAG AA:

  | Pair | Minimum |
  | --- | --- |
  | `--ui-text` on `--ui-bg` and on `--ui-surface` | 4.5:1 |
  | `--ui-text-muted` on `--ui-bg` | 4.5:1 |
  | `--ui-accent` on `--ui-bg` (links) | 4.5:1 |
  | `--ui-on-accent` on `--ui-accent` (buttons) | 4.5:1 |
  | `--ui-border` and `--ui-focus` on `--ui-bg` | 3:1 |

- **A new semantic colour comes with its pairs** in the test, in the same PR.

### 9. The plugin, `ui/vite`

- **For the site:** renders each page component into its `index.html` stub, and injects the CSS links, `theme.js` and the favicon.
- **For the examples:** `ui({ bar: true })` injects the rendered `Bar`, `shell.css` and the favicon into the app's `index.html`. Basic uses `ui({ header: true })` with the tokens, so it follows the visitor's theme.
- **Every file it emits is same-origin, with no inline script or style,** so it works under ADR 0002's CSP.
- It follows the pattern of `shared/browser-check.ts`, which already injects into every app page.

### 10. Brand

- **The logo is plan step 7a:**
  - the ∞ mark generated with Higgsfield (a quote first, 6–8 candidates, a licence check before adoption), then tidied by hand into SVG
  - the wordmark "Isol∞p" (lowercase l, the "oo" as the mark) set in type as SVG, not generated, since image models get lettering wrong
- **The files live in `packages/ui/brand/`:**
  - `mark.svg`, `wordmark.svg`, `lockup.svg`, each with a monochrome version
  - `favicon.svg`, plus a 32 px PNG fallback
- **`brand/source/`** keeps the generated originals, the prompts, and a note on Higgsfield's terms for commercial use and ownership of the output.
- **The favicon goes on every page,** dashboards included, through the plugin. The Open Graph images belong to `apps/site` (ADR 0002, decision 9).
- **Until the logo exists,** the text "Isoloop" stands in, and there's no favicon.

### 11. How it changes

- **`ui` has no version.** Every app uses it from the workspace, so a change reaches every app in the same PR.
- **The contract** is the component props, the `ui-` class names, the semantic token names, and the markup `Bar` and `Header` produce. Changing any of these updates every user in that PR.
- **When `packages/ui` changes,** CI runs the site job (ADR 0002, decision 11) and basic's E2E. A change to `Bar` also runs the dashboards' checks.

## Consequences

**Good**

- The site, the hub and basic share one source for their look. The dashboards share a way back without changing their own look or bundles.
- Visitors get static HTML and CSS: no framework code, no hydration, nothing that needs JS to read.
- Markup from data is typed and escaped, and a wrong prop fails `tsc`.
- Contrast in both themes is checked on every PR, and components are checked for accessibility before a page uses them.
- `preact-render-to-string` sits behind `render()`, with a conformance test, so it can be swapped.
- No web fonts, no CSS framework and no token toolchain.

**Bad**

- One new dependency, `preact-render-to-string`. `preact` is already in the catalog.
- Our own plugin, contrast test and `oklch` conversion are code we maintain.
- Copy written as JSX text is less pleasant to edit than plain HTML or Markdown. M4's docs will be Markdown.
- The dashboards stay visually separate: dark-only, their own styles. Only the bar ties them in.
- Dead nav links when a dashboard runs on its own in dev.
- Until steps 7a and 7b, the tokens are placeholders and there's no logo.

## Alternatives considered

- **Plain HTML partials and string templates** (ADR 0002 as first accepted): no dependency, but escaping, loops over data and markup typos are all ours to handle. That's fine for a header and a footer, worse for the hub, the cards, the tables and the M4 docs.
- **Preact or React in the browser** (client-rendered or hydrated): a framework and our component code on every page, blank or unstyled pages until JS runs, for pages with no state.
- **Web components (custom elements):** native and dependency-free, but they render in the browser, so the header and cards would need JS to appear, without declarative shadow DOM and its own caveats.
- **Tailwind, UnoCSS:** a dependency and utility classes throughout the markup, where modern CSS (custom properties, `@layer`, `clamp()`) covers what we need.
- **Token libraries (Open Props, Radix Colors):** good scales, but a dependency for values we can write and test ourselves, and their names would leak into our contract.
- **A token toolchain (Style Dictionary, JSON tokens):** a build step and a second format, for one consumer (CSS).
- **Hex colours:** simpler to read, but uneven lightness steps make scales harder to tune. The test converts `oklch` either way.
- **Web fonts:** a request per font, a flash of other text, and nothing the wordmark needs, since it's an SVG.
- **One theme (dark, like the dashboards):** simpler, but a front page and docs are read in daylight too, and the system preference is what visitors expect.
- **The bar following the visitor's theme on the dashboards:** a light bar on a dark dashboard would look like two things joined, which is what this design system exists to avoid.
- **A versioned or published `ui` package:** nothing outside this repo uses it, and the workspace already gives one version.
