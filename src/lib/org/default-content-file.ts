/**
 * Read/write `defaultContent.yaml` on disk (used by API and hot-reload loader).
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { getReadableDataPath, getWritableDataPath } from "@/lib/runtime-paths";
import { loadYaml } from "@/lib/yaml-utils";
import { stripOrgPrefixesForDisk } from "@/lib/org/content-disk-serialize";

export function getDefaultContentReadFile(): string {
  return getReadableDataPath("org", "defaultContent.yaml");
}

export function getDefaultContentWriteFile(): string {
  return getWritableDataPath("org", "defaultContent.yaml");
}

export type DefaultContentFileShape = {
  defaultContent: Record<string, unknown>;
  sectionOrder: string[];
};

export function readDefaultContentFile(): DefaultContentFileShape {
  const parsed = loadYaml<{
    defaultContent?: Record<string, unknown>;
    sectionOrder?: string[];
  } | null>(getDefaultContentReadFile(), null);
  const data = parsed ?? {};
  const defaultContent =
    typeof data.defaultContent === "object" && data.defaultContent !== null && !Array.isArray(data.defaultContent)
      ? data.defaultContent
      : {};
  const sectionOrder = Array.isArray(data.sectionOrder) ? data.sectionOrder : [];
  return { defaultContent, sectionOrder };
}

/** Shallow-merge top-level keys into defaultContent and write file. */
export function mergeTopLevelIntoDefaultContentFile(merge: Record<string, unknown>): void {
  const { defaultContent: dc, sectionOrder } = readDefaultContentFile();
  for (const [k, v] of Object.entries(merge)) {
    dc[k] = stripOrgPrefixesForDisk(v) as unknown;
  }
  const out: DefaultContentFileShape = { defaultContent: dc, sectionOrder };
  const writeFile = getDefaultContentWriteFile();
  if (!fs.existsSync(path.dirname(writeFile))) {
    fs.mkdirSync(path.dirname(writeFile), { recursive: true });
  }
  fs.writeFileSync(writeFile, yaml.dump(out, { lineWidth: -1, noRefs: true }), "utf8");
}
