/**
 * Server-only: get last-modified time and data path for each admin category.
 * Used on the org admin hub to show hints.
 */

import fs from "node:fs";
import path from "node:path";
import { getAppPackageRoot } from "@/lib/app-package-root";

const ROOT = getAppPackageRoot();

function getMtime(filePath: string): number | null {
  try {
    if (fs.existsSync(filePath)) return fs.statSync(filePath).mtimeMs;
  } catch {}
  return null;
}

function latestMtime(paths: string[]): number | null {
  let latest: number | null = null;
  for (const p of paths) {
    const m = getMtime(p);
    if (m != null && (latest == null || m > latest)) latest = m;
  }
  return latest;
}

function latestInDir(dir: string): number | null {
  let latest: number | null = null;
  try {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      const m = stat.mtimeMs;
      if (latest == null || m > latest) latest = m;
      if (stat.isDirectory()) {
        const sub = latestInDir(full);
        if (sub != null && (latest == null || sub > latest)) latest = sub;
      }
    }
  } catch {}
  return latest;
}

export type AdminCategoryMeta = {
  lastModified: Date | null;
  lastModifiedLabel: string;
  dataPath: string;
};

export function getAdminCategoriesMeta(): Record<string, AdminCategoryMeta> {
  const projectsIndex = path.join(ROOT, "data", "org", "projects", "index.yaml");
  const projectsDetails = path.join(ROOT, "data", "org", "projects", "details");
  const projectsM = Math.max(
    latestMtime([projectsIndex]) ?? 0,
    latestInDir(projectsDetails) ?? 0
  );

  const eventsIndex = path.join(ROOT, "data", "events", "index.yaml");
  const eventsDetails = path.join(ROOT, "data", "events", "details");
  const eventsM = Math.max(
    latestMtime([eventsIndex]) ?? 0,
    latestInDir(eventsDetails) ?? 0
  );

  const defaultContent = path.join(ROOT, "data", "org", "defaultContent.yaml");
  const contentM = getMtime(defaultContent);
  const auditLog = path.join(ROOT, "data", "admin", "audit-log.jsonl");
  const auditM = getMtime(auditLog);
  const mailingListFile = path.join(ROOT, "data", "org", "mailing-list.json");
  const mailingListM = getMtime(mailingListFile);

  function formatDate(ms: number | null): string {
    if (ms == null || ms <= 0) return "—";
    const d = new Date(ms);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return {
    projects: {
      lastModified: projectsM && projectsM > 0 ? new Date(projectsM) : null,
      lastModifiedLabel: formatDate(projectsM && projectsM > 0 ? projectsM : null),
      dataPath: "data/org/projects/index.yaml, data/org/projects/details/*.yaml",
    },
    events: {
      lastModified: eventsM && eventsM > 0 ? new Date(eventsM) : null,
      lastModifiedLabel: formatDate(eventsM && eventsM > 0 ? eventsM : null),
      dataPath: "data/events/index.yaml, data/events/details/*.yaml",
    },
    homepage: {
      lastModified: contentM ? new Date(contentM) : null,
      lastModifiedLabel: formatDate(contentM),
      dataPath: "data/org/defaultContent.yaml (homepage sections)",
    },
    about: {
      lastModified: contentM ? new Date(contentM) : null,
      lastModifiedLabel: formatDate(contentM),
      dataPath: "data/org/defaultContent.yaml (about section)",
    },
    donate: {
      lastModified: contentM ? new Date(contentM) : null,
      lastModifiedLabel: formatDate(contentM),
      dataPath: "data/org/defaultContent.yaml (donation section)",
    },
    resources: {
      lastModified: contentM ? new Date(contentM) : null,
      lastModifiedLabel: formatDate(contentM),
      dataPath: "data/org/defaultContent.yaml (resources section)",
    },
    mailingList: {
      lastModified: mailingListM ? new Date(mailingListM) : null,
      lastModifiedLabel: formatDate(mailingListM),
      dataPath: "data/org/mailing-list.json",
    },
    logs: {
      lastModified: auditM ? new Date(auditM) : null,
      lastModifiedLabel: formatDate(auditM),
      dataPath: "data/admin/audit-log.jsonl",
    },
  };
}
