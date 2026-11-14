# ADR 0003: The design system, `packages/ui`

- **Status:** Accepted
- **Date:** 2026-11-14
- **Amended:** 2026-11-14, for the approved design (decisions 3, 5, 6 and 7; see [the amendment](#amended-for-the-approved-design-2026-11-14))
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

### Amended for the approved design (2026-11-14)

The first round of directions changed only colours on one layout, and read as generic. The approved design is concept A, "the recording", from a second round made with Anthropic's `frontend-design` guidance. It changes decisions 3, 5, 6 and 7, and adds a layout rule and a motion rule. Where this section and the decisions above disagree, this section wins.

**One typeface, self-hosted (decision 5).** Decision 5 said system fonts only and no web fonts. Now:
- **Archivo** (variable: weight 100–900, width 62–125%), under the SIL Open Font License 1.1, is the only typeface.
- **It's self-hosted** as one same-origin `woff2` file (latin subset, about 90 KB) with its licence next to it in `packages/ui`. Same-origin keeps it within `default-src 'self'` (ADR 0002, decision 8). It loads with `font-display: swap` and one preload.
- **Its width axis carries the hierarchy:**
  - the headline at 68% width and weight 820
  - section headings at 80%
  - labels, nav, table heads and track names at 87%
  - body text at 100%

  Figures are tabular wherever numbers line up.
- **Code stays in the system monospace stack.** Monospace is used only for code, never for labels.
- **The wordmark** is "Isol∞p" set in Archivo, with the ∞ as an inline SVG, until the logo (plan task 5) replaces it.

**Palette (decision 3).** The token layers and names stay as they are. The values come from concept A: a cool paper ground, near-black ink, and one colour per part of the system. The values below are hex for reference; `tokens.css` holds them in `oklch()`.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--ui-bg` | `#f6f7f9` | `#161c2c` | page |
| `--ui-surface` | `#ffffff` | `#1d2436` | panels, the recording, tables |
| `--ui-text` | `#14161c` | `#e9ecf3` | text |
| `--ui-text-muted` | `#4a5160` | `#aab2c3` | secondary text |
| `--ui-border` | `#d5dae2` | `#34405a` | rules, grid |
| `--ui-accent` | `#2f57cc` | `#8aa5ff` | links, the primary action |
| `--ui-part-host` | `#5d6472` | `#9aa2b2` | the main thread, the host |
| `--ui-part-bus` | `#a62f68` | `#e58ab4` | the bus |
| `--ui-part-isolate` | `#0b7480` | `#4cc6d3` | an isolate on its own worker (the recording's second isolate, B, takes `--ui-accent`, so the two own-worker tracks stay apart) |
| `--ui-part-pool` | `#6e46c2` | `#b79af6` | a pool |
| `--ui-bad` | `#b3261e` | `#ff8f86` | a rejected record, a failure |

- **The `--ui-part-*` tokens are new,** and they're information, not decoration. The same colour always means the same part of the system: in the recording's tracks, the bars beside feature lines, and the section headings on `/features/`.
- **The contrast test (decision 8)** gains each part colour against `--ui-bg` and `--ui-surface` at 3:1, and `--ui-bad` at 4.5:1.

**Layout: a gutter of labels (decision 6).**
- **Pages are a two-column grid:** a left gutter and a body. The gutter holds section headings, which stay in view as their section scrolls past, the way the recording's tracks hold their names.
- **No card grids.** Content is lists with rules, tables and figures.
- **No eyebrow labels, no numbered markers** (features aren't a sequence), and no all-caps labels.
- **New classes:** `ui-intro`, `ui-gutter`, `ui-uses`, `ui-strip`, `ui-recording`. They join decision 6's list in `@layer ui`.

**Motion.**
- **The one memorable thing is the recording,** and the feature demos are the same kind of thing. Only they move.
- **Nothing else moves:** no entrance or scroll animations, no hover transitions on content.
- **The demos run only while on screen.** With `prefers-reduced-motion` they update without animating.
- **The one other transition** is the theme switch's knob, which jumps instead when motion is reduced.

**Header (decision 7).**
- **`Header` is sticky:** full width, an opaque `--ui-bg` background, a bottom rule in `--ui-border`, and its contents aligned with the page column.
- **`--ui-bar-h`** (4.75rem; 5.7rem below 760 px, where the nav takes a second row) sets `scroll-padding-top` and the sticky offset of the gutter headings, so anchors and headings stop below it.
- **The nav reads** Home, Features, How it works, Examples, GitHub.
- **`Bar` on the dashboards is unchanged:** thin, fixed dark, not sticky. The dashboards manage their own scrolling.

**The logo (decision 10).** It's chosen and documented in [`docs/brand.md`](../brand.md):
- **Two marks:**
  - the **everyday mark**: an isometric cube with a woven ribbon, for the header, favicon and anything small
  - the **expressive mark**: the same inside a cycle arrow, for social cards and large uses
- **Gradients** (indigo → violet → teal, from the palette) are allowed in the logo only. The rest of the design system stays flat.
- **The wordmark** is "isoloop" in lowercase Archivo, set in type. The "Isol∞p" wordmark of decision 10 is dropped.

**The theme switch (decision 4).**
- **`ThemeToggle` becomes a switch:** `role="switch"`, named "Dark theme", with `aria-checked` true in dark mode.
- **The look:** a sun and a moon inside a pill, and a knob that slides behind the active one.
- **It's operated** by click, Space and Enter. Its state comes from `theme.js`, as before.

## Consequences

**Good**

- (Amendment) The site has a point of view drawn from its subject: tracks, loops and parts of the system. It isn't a palette swap on a generic layout.
- The site, the hub and basic share one source for their look. The dashboards share a way back without changing their own look or bundles.
- Visitors get static HTML and CSS: no framework code, no hydration, nothing that needs JS to read.
- Markup from data is typed and escaped, and a wrong prop fails `tsc`.
- Contrast in both themes is checked on every PR, and components are checked for accessibility before a page uses them.
- `preact-render-to-string` sits behind `render()`, with a conformance test, so it can be swapped.
- No web fonts, no CSS framework and no token toolchain.

**Bad**

- (Amendment) One web font now loads on every site page, about 90 KB, which decision 5 avoided. It's same-origin, subset and swapped, but it's a request and a reflow that system fonts don't have.
- (Amendment) Part colours make a vocabulary readers have to learn. The recording's legend teaches it once, and the colours are never the only signal: every part is also named in text.
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
- **(Amendment) The first round of directions** (slate & signal, paper & ink, night signal): the same layout with three palettes. Two of them sat on well-known generic looks (cream with serif and terracotta; near-black with one acid accent).
- **(Amendment) A typeface per role** (a display face plus a text face): Archivo's width axis gives the contrast between headline and text from one family, with one file.
- **(Amendment) Concepts B (two loops) and C (the log)** as the landing page: B's ∞ didn't show the bus or replay, and C needed reading before it landed. C's log lives on as the bus demo on `/features/`.
