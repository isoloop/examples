# Plan: the website, to `site-v0.1.0`

**Status:** in progress (2026-11-14). The decisions are in [ADR 0001](../adr/0001-what-this-repo-is.md) (this repo), [ADR 0002](../adr/0002-site-build.md) (the site build) and [ADR 0003](../adr/0003-design-system.md) (the design system). This plan only says what's left, in what order, and who does it.

**Done when:** `site-v0.1.0` is deployed and `isoloop.dev` serves the approved design: the landing page, `/features/`, `/how-it-works/` and the examples hub.

**Out:**
- **Markets figures:** they come back with [M3f](https://github.com/isoloop/isoloop/blob/main/docs/plans/README.md), markets parity, which is due before M4.
- **The M4 docs.**

## Done so far

| What | Where |
| --- | --- |
| ADRs 0001–0003 | #77, #78, #79 |
| Domain verified, repo renamed, HTTPS enforced, first deploy | maintainer and session, 2026-11-14 |
| Apps under `/examples/`, placeholder at `/` | #81 |
| `packages/ui` foundation | #82 |
| `apps/basic` | #83 |
| The site: pages, hub, diagrams, site CI | #84, #86 |
| The core diagrams with a drift test | isoloop#184 |
| four-loops out of the library repo; `/isoloop/` redirect | isoloop#185 |

## What's left

**The approved design** is concept A from the second design round:
- a landing page that opens with a short introduction, then a live recording of basic's loops
- a "What it's for" section
- a features strip, plus a `/features/` page with nine sections

The prototype is local to the maintainer's machine; the decisions it carries go into the ADR amendments below.

| # | Task | Who | Done when |
| --- | --- | --- | --- |
| 1 | **ADR amendments.** 0002: the pages and the landing page's order, `/features/`, and how basic's real heartbeats and records reach the landing recording and the feature demos. 0003: Archivo as one self-hosted font, motion limited to the live demos, concept A's palette, the sun/moon switch, the sticky header. | session writes, maintainer reviews | Both accepted |
| 2 | **Fact checks.** Whether a restarted isolate reads on from its last commit or from `earliest` (the bus code against the pools guide); the code samples on `/features/` compile. | session | Copy and demos match the code |
| 3 | **Build the design** into `packages/ui` and `apps/site`, including the link-preview images. | fork, merges on green | The site job passes, with axe, on every page and the specimens |
| 4 | **Copy.** #85 brought in line with the approved wording: the headline "Event-loop isolation for web apps", "What it's for", the pool-accurate containment text, markets without figures. | session drafts, maintainer reviews | Merged |
| 5 | **Logo.** Starting from "Isol∞p" in Archivo: a Higgsfield quote first, candidates for the ∞ mark, the maintainer picks one, then the files in `packages/ui/brand/`, the favicon and the preview images. | maintainer picks, session builds | Files committed |
| 6 | **Launch.** `basic-v0.1.0` (any time); `site-v0.1.0` after tasks 3–5; then merge isoloop#183. | maintainer | Live on `isoloop.dev` |

Order: 1 and 2, then 3; 4 and 5 can run alongside 3; then 6.

A fork stops and hands over on an ADR change, a decision not covered here or in the ADRs, or CI breaking outside its change.
