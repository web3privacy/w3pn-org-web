/**
 * Resolves the Next.js app package root: the directory that contains `data/events/index.yaml`
 * and `public/`. Walks `process.cwd()` and parents; also checks a nested `app/` folder for older checkouts.
 */

import fs from "node:fs";
import path from "node:path";

const MARKER = path.join("data", "events", "index.yaml");

export function getLocalAppPackageRoot(): string {
  const cwd = process.cwd();
  const candidates: string[] = [cwd, path.join(cwd, "app")];

  let cur = cwd;
  for (let i = 0; i < 8; i++) {
    candidates.push(cur, path.join(cur, "app"));
    cur = path.resolve(cur, "..");
  }

  const seen = new Set<string>();
  for (const dir of candidates) {
    const norm = path.resolve(dir);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (fs.existsSync(path.join(norm, MARKER))) {
      return norm;
    }
  }

  return cwd;
}
