/* Shared YAML file loader used across all data-loading modules */

import fs from "node:fs";
import yaml from "js-yaml";

export function loadYaml<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = yaml.load(content) as T | null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
