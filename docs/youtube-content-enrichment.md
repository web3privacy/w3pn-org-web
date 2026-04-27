# YouTube Content Enrichment Report

**Date:** 2026-04-12
**Source:** https://www.youtube.com/@Web3PrivacyNow/videos

---

## 1. Architecture

### Centralized Video Catalog
- **File:** `app/data/media/videos.yaml`
- **Entries:** 100 videos with structured metadata (speaker, role, event tag, tags)
- **Purpose:** Single source of truth for video metadata; events reference videos by YouTube ID, and the catalog provides enrichment at render time

### How It Works
1. **Event details** (`app/data/events/details/*.yaml`) store `youtubeIds` arrays (lightweight references)
2. **Project details** (`app/data/org/projects/details/*.yaml`) store inline video entries with `youtubeId`, `title`, `speaker`, `role`
3. **Server-side loader** (`app/src/lib/video-catalog.ts`) reads the catalog and hydrates YouTube IDs into full metadata
4. **Event detail page** passes enriched `videosMeta` to the client component
5. **Project detail page** reads inline video data directly from YAML

### New Components
- `app/src/lib/video-catalog.ts` — catalog loader with `getVideoMeta()`, `getVideosMeta()`, `getAllVideos()`
- `app/src/components/org/projects/detail/ProjectDetailVideos.tsx` — native video grid section for project pages

---

## 2. Events — Video Assignments (High Confidence)

| Event ID | Event Name | Videos |
|----------|-----------|--------|
| `c25bue` | Congress Buenos Aires 2025 | 52 |
| `c24bkk` | Congress Bangkok 2024 | 42 |
| `eps25bue` | Ethereum Privacy Stack (NEW) | 28 |
| `s23rom` | Summit Rome 2023 | 12 |
| `s24prg` | Summit Prague 2024 | 9 |
| `m24ber` | Meetup Berlin 2024 | 8 |
| `m24rom` | Meetup Rome 2024 | 7 |
| `m25tok` | Meetup Tokyo 2025 | 5 |
| `m25dam` | Meetup Amsterdam 2025 | 3 |
| `h25ber` | Hackathon Berlin 2025 | 2 |
| `pc24ber` | Privacy Corner Berlin 2024 | 2 |

**Total event-assigned videos:** ~170

---

## 3. New Event Created

### Ethereum Privacy Stack / Devconnect 2025 (`eps25bue`)
- **Type:** summit
- **Date:** 2025-11-09
- **Location:** Buenos Aires, Argentina
- **Coincidence:** Devconnect 2025
- **Videos:** 28 talks covering ZK circuits, MEV, smart contract privacy, L2 privacy, and more
- **File:** `app/data/events/details/eps25bue.yaml`
- **Index entry:** Added to `app/data/events/index.yaml`

---

## 4. Projects — Video Assignments

| Project | Videos | Content |
|---------|--------|---------|
| `academy` | 8 | Privacy education interviews and explainers |
| `publishing` | 4 | Philosophical and movement-oriented talks |
| `privacy-explorer` | 2 | Privacy tool ecosystem presentations |
| `radio` | — | YouTube channel link added to links section |

---

## 5. UX Changes

### Event Detail Video Cards (Enhanced)
- **Before:** Generic "Speaker" label, no title, no role — just thumbnail + play button
- **After:** Real speaker name, organization/role, full talk title from catalog metadata
- Removed hardcoded "3privacy Academy" badge from thumbnails
- Cards link directly to YouTube with `target="_blank"`

### Project Detail Videos Section (New)
- New `ProjectDetailVideos` component with dedicated section
- Reuses event detail talk card CSS (same visual language: grid, thumbnails, play overlay)
- Falls back gracefully when the title image asset doesn't exist
- Controlled by `sections.videos` toggle in project YAML

### Admin Editor — Events
- Thumbnail preview shown next to each YouTube ID
- YouTube URL auto-parsing (paste full URL, ID is extracted)
- Video count indicator
- Clickable thumbnail links to YouTube for verification

### Admin Editor — Projects
- New "Videos" tab in project admin editor
- Full metadata editing: YouTube ID, title, speaker, role
- Thumbnail preview per video
- YouTube URL auto-parsing
- Added to section visibility toggles

---

## 6. Medium-Confidence Candidates (Manual Review Recommended)

These videos could potentially be assigned but need human verification:

### Possibly Unassigned Event Videos
Videos in the catalog tagged with events not yet in the system or with ambiguous event matches:
- Videos tagged `s26ber` (Summit Berlin 2026) — future event, not yet fully configured
- Generic "Web3Privacy Now" branded videos without clear event context

### Cross-Event Videos
Some talks may have been given at multiple events or are meta/overview content:
- Channel intro/trailer videos
- "What is Web3Privacy Now?" style overview content
- Community update videos

### Project Candidates Not Yet Assigned
- **hackathon-pack / ethereum-privacy-hackathon-overview**: Technical EPS hackathon walkthrough videos could be added once the specific hackathon project detail pages are created
- **privacy-guides**: Policy, rights, and identity-focused talks from various events could be cross-linked

---

## 7. Files Changed

### New Files
- `app/data/media/videos.yaml` — centralized video catalog
- `app/data/events/details/eps25bue.yaml` — new EPS event detail
- `app/src/lib/video-catalog.ts` — catalog loader
- `app/src/components/org/projects/detail/ProjectDetailVideos.tsx` — project video section

### Modified Files
- `app/data/events/index.yaml` — added `eps25bue` event entry
- `app/data/events/details/{c25bue,s24prg,m24ber,m24rom,m25tok,m25dam,h25ber,pc24ber,c24bkk,s23rom}.yaml` — enabled videos sections with YouTube IDs
- `app/data/org/projects/details/{academy,privacy-explorer,publishing}.yaml` — added video entries
- `app/data/org/projects/details/radio.yaml` — added YouTube channel link
- `app/src/app/events/[eventId]/page.tsx` — loads video catalog metadata
- `app/src/components/org/events/OrgEventDetailContent.tsx` — enriched video cards with catalog data
- `app/src/app/projects/[projectId]/page.tsx` — integrated ProjectDetailVideos component
- `app/src/components/org/events/EventAdminEditor.tsx` — enhanced video admin with previews
- `app/src/components/org/projects/ProjectAdminEditor.tsx` — added videos editor section
- `app/src/styles/org/project-detail.css` — video section styles
