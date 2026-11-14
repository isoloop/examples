# Architecture decision records

Decisions about this repo: the site, the examples and the design system. Decisions about Isoloop itself are in the library repo's [ADRs](https://github.com/isoloop/isoloop/tree/main/docs/adr).

Each has a status:

- **Proposed:** a recommended default, open to review.
- **Accepted:** binding; change it only with a new ADR that supersedes it.
- **Rejected / Superseded:** kept for history.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-what-this-repo-is.md) | `isoloop/examples` renamed to `isoloop/web`: the site, examples and design system, built on the published packages; the library repo keeps the library and its docs; served at `isoloop.dev` with sections as paths; one Pages build per tag (`markets-v*`, `plant-v*`, `basic-v*`, `site-v*`); ADR 0009's toolchain by reference | Accepted |

Template: **Context** (the forces at play), **Decision**, **Consequences** (good and bad), **Alternatives considered**.
