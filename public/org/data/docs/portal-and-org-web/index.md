# Portal & Org Web — Overview

This section documents the **Privacy Portal** monorepo and the **Web3Privacy organisational website**. It is the main entry point for developers and contributors who want to understand, run, or extend these projects.

## What is the Portal?

The **Privacy Portal** is a unified hub that brings together Web3Privacy products: Explorer, Stacks, News, Academy, Events, Jobs, and more. The codebase lives in a monorepo with:

- **apps/web** — Next.js application (main portal UI)
- **apps/explorer** — Explorer app (if separate)
- **w3pn-org-web** — Organisational landing and docs (Vite + React)
- **Org web UI** — Global footer and design tokens live in-repo (`src/components/org/global-footer`, `src/styles/portal-ui`).

## What is the Org Web?

The **org web** (`w3pn-org-web`) is the organisational website for Web3Privacy Now: landing page, about, projects, donate, and this documentation. It uses the same design system and links to the portal and external docs where needed.

## Repository

- **Portal monorepo:** (this repo — add URL when published)
- **Docs upstream:** [github.com/web3privacy/docs](https://github.com/web3privacy/docs) — content is synced here for the integrated docs experience; updates are prepared locally until the full portal release.

## Next steps

- [Data structure](./data-structure) — folders, data sources, config
- [Running locally](./running-locally) — how to run portal and org web
- [Testing](./testing) — how to run tests
- [Dependencies](./dependencies) — workspaces and main packages
