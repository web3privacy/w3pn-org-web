# Admin -> data -> site map

Reference for which org-web admin areas edit which files on disk, and which public pages or loaders read that content.

| Admin route | Editor / action | Storage on disk | Public readers |
|---|---|---|---|
| `/admin` | hub + export | — | — |
| `/admin/homepage` | `AdminEditor` | `data/org/defaultContent.yaml` | root layout -> `getOrgDefaultContent()` -> `OrgContentProvider` |
| `/about/admin` | `AboutAdminEditor` | `data/org/defaultContent.yaml` (`defaultContent.about`) | `/about` pages |
| `/admin/donate` | `DonateAdminEditor` | `data/org/defaultContent.yaml` (`defaultContent.donation`, `defaultContent.donatePageConfig`) | `/donate` |
| `/admin/resources` | `ResourcesAdminEditor` | `data/org/defaultContent.yaml` (`defaultContent.resources`) | `/resources` |
| `/admin/projects`, `/admin/projects/[id]/edit` | `ProjectAdminEditor` | `data/org/projects/index.yaml`, `data/org/projects/details/*.yaml` | `/projects`, `/projects/[projectId]` via `src/lib/org/w3pn-projects.ts` |
| `/events/admin`, `/events/admin/edit/[id]` | `EventAdminEditor` | `data/events/events-user.yaml`, `data/events/events-visibility.yaml`, `data/events/details/*.yaml` | `/events`, `/events/[eventId]` via `src/lib/events.ts`, `src/lib/event-details.ts`, `src/lib/org/events-data.ts` |
| `/admin/mailing-list` | mailing list admin | `data/org/mailing-list.json` | admin-only readers plus newsletter admin APIs |
| `/admin/logs` | audit log viewer | `data/admin/audit-log.jsonl` | admin-only readers |
| admin upload endpoints | `AdminFileUpload` | `public/images/about-us/sections/about/assets/gallery/**`, `public/images/site-shared/admin-uploads/**`, `public/images/projects/uploads/**`, `public/images/admin-uploads/**` | any content block that references uploaded `/images/...` asset URLs |

## Runtime notes

- Org web public pages use YAML as the canonical source of truth.
- `getOrgDefaultContent()` reads `data/org/defaultContent.yaml` from disk with mtime-based refresh.
- Org projects are loaded from `data/org/projects/**`, not from `src/data/org/**`.
- Events are loaded only from `data/events/**`; `public/org/events.json` is no longer part of the runtime path.
- On Vercel, write operations are blocked by read-only filesystem constraints. Persistent admin writes require local Node or a writable server.
- When `ADMIN_PASSWORD` is set, admin pages and admin APIs require authentication via `/admin/login`.

## Legacy note

If you still see references to removed JSON mirrors from older org-web iterations, treat them as stale documentation only. The canonical runtime sources for the current app are the YAML files under `data/`.
