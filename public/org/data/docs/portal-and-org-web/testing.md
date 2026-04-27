# Testing

## This repository

There is no dedicated automated test suite yet. Useful checks:

```bash
npm run lint   # TypeScript check (tsc --noEmit)
npm run build
```

To add tests later, consider Vitest or Jest for units and Playwright for E2E against `npm run build` + `npm start`.

## CI

When CI is configured, it should at minimum run `npm run lint` and `npm run build` from the repository root.
