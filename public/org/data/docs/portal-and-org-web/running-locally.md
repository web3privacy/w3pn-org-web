# Running locally

How to run this Next.js site on your machine.

## Prerequisites

- **Node.js** 18.17+ (20 LTS recommended)
- **npm**

## Start the dev server

From the **repository root**:

```bash
npm install
npm run dev
```

- Site runs at **http://localhost:3000** (or the port Next.js prints).
- Use `npm run dev:turbo` for Turbopack if you prefer.

## Environment

Copy `.env.example` to `.env.local` at the repo root and set `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` if you need admin routes locally.

## Fetching latest docs (optional)

Docs live under `public/org/data/docs/`. If you maintain a separate sync script from [web3privacy/docs](https://github.com/web3privacy/docs), run it from the repo root as documented in that script.
