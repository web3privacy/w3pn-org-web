# Dependencies

Single **npm** package at the repository root (`@web3privacy/org-web` in `package.json`). There are no npm workspaces.

The global footer UI and design-token CSS are **vendored in-repo** (`src/components/org/global-footer`, `src/styles/portal-ui`).

## Stack

- **Next.js** 16
- **React** 19
- **Tailwind CSS** — styling
- Other deps (Radix, markdown, etc.) — see root `package.json`

```bash
npm install
```

## Docs content

Docs are **not** an npm dependency. They live under `public/org/data/docs/`.

## Adding or updating dependencies

From the repository root:

```bash
npm install <pkg>
```

Then commit the updated `package-lock.json`.
