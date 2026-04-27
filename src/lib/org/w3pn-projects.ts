/**
 * W3PN org projects loader.
 * Data is read directly from `data/org/projects/*.yaml`.
 *
 * SEPARATION FROM EXPLORER:
 * - Explorer (portal) uses: data/explorer-data/index.json, /api/projects, and
 *   /project-assets/projects/{id}/{file} (from public/project-assets/).
 * - Org web uses YAML project data under data/org/projects and image assets under /images.
 * Do not mix these: org project IDs (e.g. "academy", "privacy-explorer") and
 * explorer project IDs (e.g. "presearch", "nemi") are different datasets.
 */

import { loadProjectsFromYaml, loadProjectDetailFromYaml } from "@/lib/org/project-details";

const ORG_BASE = "/org";

const CATEGORY_ORDER = ["infrastructure", "education", "tools", "research", "media"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: "INFRASTRUCTURE",
  education: "EDUCATION",
  tools: "TOOLS",
  research: "RESEARCH",
  media: "MEDIA",
};

const ID_TO_CATEGORY: Record<string, string> = {
  "privacy-explorer": "infrastructure",
  "privacy-portal": "infrastructure",
  jobs: "infrastructure",
  "gitcoin-privacy-round": "infrastructure",
  "drips-for-privacy": "infrastructure",
  "join-in-privacy": "other",
  academy: "education",
  "personal-stacks": "education",
  "hackathon-pack": "education",
  "cypherpunk-launchpad": "education",
  ideas: "tools",
  "cypherpunk-osint-toolkit": "tools",
  scoring: "other",
  "blur-tool": "tools",
  "privacy-audits": "research",
  "privacy-ecosystem-report": "research",
  "privacy-market-dashboard": "research",
  "ethereum-privacy-hackathon-overview": "research",
  "annual-report": "other",
  pagency: "other",
  hiring: "other",
  "privacy-guides": "other",
  "usecase-db": "other",
  "zk-solutions": "other",
  newsletter: "media",
  "privacy-tech-awards": "media",
  publishing: "media",
  radio: "media",
};

const PROJECT_ICONS: Record<string, string> = {
  "gitcoin-privacy-round": `${ORG_BASE}/images/projects/items/gitcoin-privacy-round/icon/project-gitcoin-privacy-round.webp`,
  "privacy-explorer": `${ORG_BASE}/images/projects/items/privacy-explorer/icon/project-privacy-explorer.webp`,
  "privacy-portal": `${ORG_BASE}/images/projects/items/privacy-portal/icon/project-privacy-portal.webp`,
  jobs: `${ORG_BASE}/images/projects/items/jobs/icon/project-jobs.webp`,
  "join-in-privacy": "/images/home/sections/activities/assets/projects/portal-logo.webp",
  academy: `${ORG_BASE}/images/projects/items/academy/icon/project-academy.webp`,
  "personal-stacks": `${ORG_BASE}/images/projects/items/personal-stacks/icon/project-personal-stacks.webp`,
  "hackathon-pack": `${ORG_BASE}/images/projects/items/hackathon-pack/icon/project-hackathon-pack.webp`,
  "privacy-tech-awards": `${ORG_BASE}/images/projects/items/privacy-tech-awards/icon/project-privacy-tech-awards.webp`,
  newsletter: `${ORG_BASE}/images/projects/items/newsletter/icon/project-newsletter.webp`,
  radio: `${ORG_BASE}/images/projects/items/radio/icon/project-radio.png`,
  ideas: `${ORG_BASE}/images/projects/items/ideas/icon/project-ideas.webp`,
  "privacy-ecosystem-report": `${ORG_BASE}/images/projects/items/privacy-ecosystem-report/icon/project-privacy-ecosystem-report.webp`,
};

type Project = { id: string; icon?: string; category?: string; order?: number; [k: string]: unknown };

function mapCategory(p: Project): string {
  return ID_TO_CATEGORY[p.id] ?? (CATEGORY_ORDER.includes(p.category as (typeof CATEGORY_ORDER)[number]) ? (p.category as string) : "research");
}

function withResolvedIcon(p: Project): Project {
  const icon = p.icon ?? PROJECT_ICONS[p.id] ?? "/images/projects/page/assets/projects/explorer-logo.svg";
  return { ...p, icon };
}

export function getProjects(): Project[] {
  const projectsData = loadProjectsFromYaml() ?? [];
  return projectsData
    .map((p) => withResolvedIcon(p as Project))
    .filter((p) => !(p.hidden === true))
    .map((p) => ({ ...p, category: mapCategory(p) }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/** All projects including hidden (for admin). */
export function getAllProjects(): Project[] {
  const projectsData = loadProjectsFromYaml() ?? [];
  return projectsData.map((p) => withResolvedIcon(p as Project)).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

/** Get project by id including hidden (for admin). */
export function getProjectForAdmin(id: string): Project | undefined {
  return getAllProjects().find((p) => p.id === id);
}

export function getProjectDetail(id: string): Record<string, unknown> | null {
  return loadProjectDetailFromYaml(id);
}

const INFRASTRUCTURE_ORDER = [
  "privacy-explorer",
  "privacy-portal",
  "jobs",
  "gitcoin-privacy-round",
  "drips-for-privacy",
] as const;
const MEDIA_ORDER = ["newsletter", "privacy-tech-awards", "publishing"] as const;

function sortByOrder<T extends { id: string; order?: number }>(
  list: T[],
  orderIds: readonly string[]
): T[] {
  return [...list].sort((a, b) => {
    const ai = orderIds.indexOf(a.id);
    const bi = orderIds.indexOf(b.id);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return (a.order ?? 999) - (b.order ?? 999);
  });
}

export function getProjectsByCategory(): Map<string, Project[]> {
  const projects = getProjects();
  const byCategory = new Map<string, Project[]>();
  for (const cat of CATEGORY_ORDER) {
    let list = projects.filter((p) => p.category === cat);
    if (cat === "infrastructure") {
      list = sortByOrder(list, INFRASTRUCTURE_ORDER);
    } else if (cat === "media") {
      list = sortByOrder(list, MEDIA_ORDER);
    }
    byCategory.set(cat, list);
  }
  return byCategory;
}

export function getCategoryOrder(): readonly string[] {
  return CATEGORY_ORDER;
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}
