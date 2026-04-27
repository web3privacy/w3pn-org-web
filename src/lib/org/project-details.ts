/**
 * Load and save org project data from YAML.
 * This is the canonical source for project index and per-project details.
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { getReadableDataPath, getWritableDataPath } from "@/lib/runtime-paths";
import { loadYaml } from "@/lib/yaml-utils";

const WRITABLE_PROJECTS_DIR = path.dirname(getWritableDataPath("org", "projects", "placeholder"));
const WRITABLE_DETAILS_DIR = path.join(WRITABLE_PROJECTS_DIR, "details");
const INDEX_FILE = getReadableDataPath("org", "projects", "index.yaml");
const WRITABLE_INDEX_FILE = getWritableDataPath("org", "projects", "index.yaml");

export function loadProjectsFromYaml(): Array<Record<string, unknown>> | null {
  const raw = loadYaml<unknown[] | { projects?: unknown[] } | null>(INDEX_FILE, null);
  if (!raw) return null;
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  const arr = (raw as { projects?: unknown[] }).projects;
  return Array.isArray(arr) ? (arr as Array<Record<string, unknown>>) : null;
}

export function saveProjectsIndex(projects: Array<Record<string, unknown>>): void {
  if (!fs.existsSync(WRITABLE_PROJECTS_DIR)) {
    fs.mkdirSync(WRITABLE_PROJECTS_DIR, { recursive: true });
  }
  fs.writeFileSync(WRITABLE_INDEX_FILE, yaml.dump(projects, { lineWidth: -1, noRefs: true }), "utf8");
}

export function loadProjectDetailFromYaml(projectId: string): Record<string, unknown> | null {
  const filePath = getReadableDataPath("org", "projects", "details", `${projectId}.yaml`);
  const detail = loadYaml<Record<string, unknown> | null>(filePath, null);
  if (!detail || typeof detail !== "object") return null;
  return detail;
}

/** Save project detail to YAML (for future admin). */
export function saveProjectDetail(projectId: string, detail: Record<string, unknown>): void {
  if (!fs.existsSync(WRITABLE_DETAILS_DIR)) {
    fs.mkdirSync(WRITABLE_DETAILS_DIR, { recursive: true });
  }
  const filePath = path.join(WRITABLE_DETAILS_DIR, `${projectId}.yaml`);
  fs.writeFileSync(filePath, yaml.dump(detail, { lineWidth: -1, noRefs: true }), "utf8");
}
