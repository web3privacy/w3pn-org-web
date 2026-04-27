/**
 * Loads `.env` from the project root (and a few parent paths for `next start` standalone) into `process.env`.
 * `next.config` loading alone is not always applied to Route Handlers / workers after `next start`.
 * Do not import this from Edge Middleware (no Node fs).
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

export function ensureLocalEnvLoaded(): void {
  const cwd = process.cwd();
  const dirs: string[] = [
    cwd,
    path.resolve(cwd, ".."),
    // `next start` from standalone: cwd may be `.next/standalone` → repo root is 3 levels up
    path.resolve(cwd, "..", "..", ".."),
    path.resolve(cwd, "..", ".."),
  ];

  const seen = new Set<string>();
  for (const dir of dirs) {
    if (seen.has(dir)) continue;
    seen.add(dir);
    try {
      if (!fs.existsSync(dir)) continue;
      const hasEnv =
        fs.existsSync(path.join(dir, ".env")) ||
        fs.existsSync(path.join(dir, ".env.local")) ||
        fs.existsSync(path.join(dir, ".env.production"));
      if (hasEnv) {
        loadEnvConfig(dir);
      }
    } catch {
      // ignore
    }
  }
}
