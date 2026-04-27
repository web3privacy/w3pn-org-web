# Web3Privacy Now Org Web

Single-repo Next.js application for the public Web3Privacy Now website and its filesystem-backed admin.

## What this repo contains

- Public site pages:
  - `/`
  - `/about`
  - `/events`
  - `/events/[eventId]`
  - `/projects`
  - `/projects/[projectId]`
  - `/resources`
  - `/donate`
  - `/privacy-portal`
  - `/docs/[...slug]`
- Admin pages:
  - `/admin`
  - `/admin/homepage`
  - `/about/admin`
  - `/admin/donate`
  - `/admin/resources`
  - `/admin/projects`
  - `/admin/projects/[id]/edit`
  - `/events/admin`
  - `/events/admin/edit/[id]`
  - `/admin/mailing-list`
  - `/admin/logs`
- Admin and content APIs under `src/app/api/**`

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- `js-yaml` for YAML-backed content
- Filesystem-backed admin storage

## Important deployment reality

This project is **file-backed**, not database-backed.

- Public content is read from YAML, JSON, Markdown/MDX, and image files inside the repo.
- Admin writes save directly back to files in `data/` and `public/`.
- On **read-only/serverless hosting** such as Vercel, write actions are intentionally blocked.
- If you want production admin editing to work, deploy to a host with a **persistent writable filesystem** or replace the storage layer with external storage/database.

If the source code goes to GitHub publicly:

- never commit `.env*`
- keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` only in environment variables
- assume admin writes on production do **not** automatically sync back to git
- keep runtime-only files like mailing-list exports and admin audit logs out of git

Recommended on VPS:

- set `W3PN_DATA_ROOT` to a persistent directory outside the deployed release, for example `/var/lib/w3pn-data`
- keep uploaded files on a persistent mounted or symlinked path under `public/`, because image uploads still use public asset URLs

## Project layout

```text
.
|-- data/                         # Canonical content data
|   |-- admin/                    # Audit log
|   |-- events/                   # Event list + detail YAML
|   `-- org/                      # Shared site content + project YAML
|-- docs/                         # Internal repo docs
|-- public/                       # Static assets, docs files, downloadable resources
|-- scripts/                      # One-off content/image helper scripts
|-- src/
|   |-- app/                      # Next.js routes, layouts, metadata routes, APIs
|   |-- components/               # Public UI + admin editors
|   |-- hooks/                    # Client hooks
|   |-- lib/                      # Loaders, validation, auth, helpers
|   |-- styles/                   # Global/site CSS
|   `-- types/                    # Shared TS types
|-- .env.example
|-- eslint.config.mjs
|-- next.config.ts
|-- package.json
`-- README.md
```

## Local setup

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill the secrets:

```bash
cp .env.example .env.local
```

Required for admin:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Recommended:

- `NEXT_PUBLIC_SITE_URL=https://web3privacy.info`

Optional:

- `NEXT_PUBLIC_ALLOWED_NEWSLETTER_ACTION_HOSTS`
- `ORG_WEB_STANDALONE=1`
- `W3PN_DATA_ROOT=/var/lib/w3pn-data`
- `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC=https://analytics.example.com/js/pa-XXXXX.js`
- `NEXT_PUBLIC_PLAUSIBLE_ENDPOINT=https://analytics.example.com/api/event`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=web3privacy.info` for legacy `script.js` snippets only

### Run

```bash
npm run dev
```

### Build and start

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

Lint passes with the current flat-config ruleset. The repo intentionally allows native `<img>` in places where public/admin-editable assets remain under `public/images/**`.

## Content source of truth

### Shared site content

- `data/org/defaultContent.yaml`

Used by:

- homepage
- about page
- donate page
- resources page
- shared footer/global org content

### Projects

- Index/listing:
  - `data/org/projects/index.yaml`
- Detail pages:
  - `data/org/projects/details/*.yaml`

Used by:

- `/projects`
- `/projects/[projectId]`

### Events

- Base index:
  - `data/events/index.yaml`
- Local/admin overrides:
  - `data/events/events-user.yaml`
- Hidden IDs:
  - `data/events/events-visibility.yaml`
- Detail pages:
  - `data/events/details/*.yaml`

Used by:

- `/events`
- `/events/[eventId]`

### Mailing list

- `data/org/mailing-list.json`

Used by:

- footer subscribe flow
- `/admin/mailing-list`

### Audit log

- `data/admin/audit-log.jsonl`

Used by:

- `/admin/logs`

### Docs

- Local docs files:
  - `public/org/data/docs/**`
- Remote docs fallback:
  - GitHub raw docs for non-local pages via `src/app/docs/[[...slug]]/page.tsx`

## Public asset paths

### Core site assets

- `public/logo.svg`
- `public/logo-white.svg`
- `public/share/homepage-share.png`

### Events assets

- `public/events/**`
- `public/images/events/items/<event-id>/**`

### Project assets

- `public/images/projects/items/<project-id>/**`
- `public/images/projects/shared/**`
- admin uploads for projects:
  - `public/images/projects/uploads/**`

### About / homepage uploads

- gallery uploads:
  - `public/images/about-us/sections/about/assets/gallery/**`
- generic hero/shared uploads:
  - `public/images/site-shared/admin-uploads/**`
- generic admin uploads:
  - `public/images/admin-uploads/**`

### Donate assets

- `public/images/donate/**`
- admin uploads:
  - `public/images/donate/uploads/**`

### Resources assets

- downloadable/public resources:
  - `public/images/resources/**`
- source files excluded from git noise:
  - `public/images/resources/source-files/**`

## Admin map

For a short route-to-file map, see [docs/ADMIN_DATA_MAP.md](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/docs/ADMIN_DATA_MAP.md).

Persistent VPS storage checklist:

- [docs/VPS_DEPLOY_CHECKLIST.md](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/docs/VPS_DEPLOY_CHECKLIST.md)

## GitHub automation

This repo now includes:

- `.github/workflows/ci.yml`
  - installs dependencies with `npm ci`
  - runs `npm run lint`
  - runs `npm run build`
- `.github/workflows/secret-scan.yml`
  - runs Gitleaks against the checked-out repo on push, PR, manual runs, and a weekly schedule
- `.github/dependabot.yml`
  - keeps npm dependencies and GitHub Actions up to date

## Monitoring note

Plausible helps with privacy-first traffic analytics, but it is **not** uptime monitoring.

For production, add server or third-party monitoring for:

- HTTP uptime checks
- SSL expiry alerts
- disk space
- memory / restarts
- 5xx error visibility

## Licensing

This repo is intentionally **copyleft**, not permissive MIT.

- Software and source code are licensed under `GNU AGPL-3.0-or-later`.
- Original website content, documentation, and original media are licensed under `CC BY-SA 4.0`.
- The full license texts live in:
  - [LICENSE](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/LICENSE)
  - [LICENSE-CONTENT](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/LICENSE-CONTENT)
  - [docs/LICENSING.md](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/docs/LICENSING.md)

Important exceptions:

- third-party trademarks, partner logos, sponsor logos, and other clearly third-party brand assets are **not** relicensed by W3PN unless explicitly stated
- embedded external media keeps the license of its original publisher

Why this was chosen:

- the previous public repo used MIT, which allows closed proprietary forks
- this repo now protects community improvements to the software via AGPL
- it also keeps movement content remixable and re-shareable under the same terms via CC BY-SA

### `/admin/homepage`

Edits `data/org/defaultContent.yaml`.

Sections currently exposed in UI:

- Hero
- Events page hero
- Projects page hero
- Partners strip
- Project detail – Partners (placeholder)
- Ecosystem (Intro)
- Worldwide Impact
- Video section
- Privacy as Ecosystem
- Testimonials

### `/about/admin`

Edits `data/org/defaultContent.yaml` under the `about` branch.

Sections currently exposed in UI:

- Hero
- Mission
- Roadmap
- Activism
- Values
- Our Work
- Gallery
- Who is W3PN
- Advisors
- FAQ

### `/admin/donate`

Edits `data/org/defaultContent.yaml` under donation-related branches.

Sections currently exposed in UI:

- Hero
- Get Involved
- NFTs
- Donation Amounts
- Membership

### `/admin/resources`

Edits `data/org/defaultContent.yaml` under the `resources` branch.

Sections currently exposed in UI:

- Hero
- Kit Cards
- Categories

### `/admin/projects`

Edits `data/org/projects/index.yaml`.

Each project listing item should contain at minimum:

- `id`
- `name`

Recommended listing fields:

- `description`
- `category`
- `order`
- `hidden`
- `image`
- `icon`
- `links`

### `/admin/projects/[id]/edit`

Edits `data/org/projects/details/<project-id>.yaml`.

Editor tabs currently exposed:

- Display
- Section visibility
- Hero & Metrics
- Mission highlights
- Screenshots (main grid)
- Links
- Mission
- Features
- Articles
- Videos
- Roadmap
- Testimonials
- Contribute
- Feedback
- Team
- Partners
- JSON

Typical project detail branches used by the site:

- `hero`
- `sections`
- `mission`
- `links`
- `screenshots`
- `features`
- `articles`
- `videos`
- `roadmap`
- `testimonials`
- `contribute`
- `feedback`
- `team`
- `partners`
- `donate` (only if rendered by the page)

### `/events/admin`

Edits:

- `data/events/events-user.yaml`
- `data/events/events-visibility.yaml`

Each event listing item should contain at minimum:

- `id`
- `type`
- `date`
- `city`
- `country`
- `lead`

Useful optional fields:

- `title`
- `description`
- `place`
- `place-address`
- `status`
- `confirmed`
- `days`
- `design`
- `links`
- `speakers`
- `hosts`
- `helpers`
- `attendees`
- `themes`
- `program-outline`
- `schedule`

### `/events/admin/edit/[id]`

Edits `data/events/details/<event-id>.yaml`.

Editor tabs currently exposed:

- Basics
- Section visibility
- Hero
- Topics
- Links
- Speakers
- Experience
- Location
- Event Map
- Program / Schedule
- Gallery
- Tickets
- Videos
- Articles
- FAQ
- Sponsors
- Contributors

Common event detail fields used by the site:

- `eventId`
- `headerImageUrl`
- `heroBackgroundImageUrl`
- `shortDescription`
- `sections`
- `topics`
- `links`
- `speakers`
- `experience`
- `location`
- `eventMap`
- `schedule`
- `gallery`
- `tickets`
- `videos`
- `articles`
- `faq`
- `sponsors`
- `contributors`

Minimum practical content for a good-looking event detail page:

- `headerImageUrl` or event header asset
- `shortDescription`
- at least one enabled section among `topics`, `links`, `speakers`, `schedule`, `location`, `gallery`

### `/admin/mailing-list`

Reads and deletes from:

- `data/org/mailing-list.json`

### `/admin/logs`

Reads:

- `data/admin/audit-log.jsonl`

## Uploads

Upload API:

- `POST /api/admin/upload?folder=<folder>`

Allowed folders:

- `uploads`
- `gallery`
- `hero`
- `projects`
- `donate`

Allowed MIME types:

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

Limits:

- max 8 MB
- filename sanitized
- file signature checked
- non-GIF images decoded with `sharp`

## Public APIs

- `GET /api/events`
- `GET /api/org/events`
- `GET /api/org/article-preview`
- `POST /api/org/mailing-list/subscribe`

Admin-protected write APIs include:

- `/api/admin/login`
- `/api/admin/logout`
- `/api/admin/upload`
- `/api/admin/mailing-list`
- `/api/events`
- `/api/events/[id]/details`
- `/api/org/default-content`
- `/api/org/projects`
- `/api/org/projects/[id]/details`
- `/api/org/resources`
- `/api/org/fetch-paragraph-cover`

## SEO and metadata

This repo now includes:

- canonical URLs
- Open Graph metadata
- Twitter/X card metadata
- `robots.txt`
- `sitemap.xml`
- `manifest.webmanifest`
- root organization / website JSON-LD
- dedicated share image:
  - `public/share/homepage-share.png`
- admin `noindex` headers

## Analytics

The app supports self-hosted Plausible analytics through environment variables.

Recommended setup:

- run Plausible Community Edition on a separate analytics subdomain
- create the site in the Plausible dashboard
- copy the exact site-specific script URL from "Site Installation"
- set `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC` in the web app environment

Optional envs:

- `NEXT_PUBLIC_PLAUSIBLE_ENDPOINT`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- `NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST`

The tracker is intentionally not rendered on admin pages.

## Release notes

Detailed release audit:

- [docs/RELEASE_AUDIT_2026-04-27.md](/Users/coinmandeer/Documents/GitHub/w3pn-org-web-pt3000/docs/RELEASE_AUDIT_2026-04-27.md)

## Known operational limits

- Admin persistence requires writable disk.
- Newsletter signup is disabled on read-only deployments.
- Rate limiting is currently in-memory, so it is best-effort on multi-instance deployments.
- Most docs pages depend on remote GitHub availability unless a local fallback exists.
- `npm run lint` currently exposes real existing code issues; treat them as open release work, not as a broken command anymore.
