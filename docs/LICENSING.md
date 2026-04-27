# Licensing

This repository uses **two complementary copyleft licenses**:

- **Code:** `GNU AGPL-3.0-or-later`
- **Content and original media:** `CC BY-SA 4.0`

This split is intentional.

- `MIT` from the old website repo was open, but it was **not copyleft**.
- `AGPL-3.0-or-later` is a stronger fit for a public-facing website because it keeps modified server-side deployments in the commons.
- `CC BY-SA 4.0` is a natural fit for text, documentation, graphics, and movement materials that should stay remixable under the same terms.

## Scope

### AGPL-3.0-or-later

Applies to the software and code in this repository, including for example:

- `src/**`
- `scripts/**`
- `next.config.ts`
- `eslint.config.mjs`
- `package.json`
- other build/runtime/configuration code unless noted otherwise

Canonical text:

- [LICENSE](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/LICENSE)

## CC BY-SA 4.0

Applies to original W3PN content and original W3PN-created site materials, including for example:

- `data/**`
- `docs/**`
- original text copy
- original images, posters, share graphics, and downloadable materials created by W3PN

Canonical text:

- [LICENSE-CONTENT](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/LICENSE-CONTENT)

## Exclusions and caveats

The following are **not automatically relicensed** by W3PN just because they appear in the repository or on the website:

- third-party trademarks
- partner logos
- sponsor logos
- speaker headshots or photos supplied by third parties
- embedded videos, articles, or external resources hosted elsewhere
- any asset that is clearly attributed to another rights holder

If a file or page includes third-party material, reuse of that material may require separate permission from the original owner.

## Practical interpretation

If someone forks this website and modifies the code:

- the software side should remain under `AGPL-3.0-or-later`
- if they deploy a modified public network version, AGPL is intended to keep those software changes shareable with users

If someone copies or remixes W3PN-written content or original graphics:

- they can do so, including commercially
- they must provide attribution
- derivative works must stay under `CC BY-SA 4.0`

## Why not MIT

The old repo used MIT:

- [Old repo license page](https://github.com/web3privacy/web/blob/main/LICENSE)

MIT is permissive and simple, but it does **not** require improvements to remain open. That conflicts with the stated goal here of being openly copyable **and** copyleft.
