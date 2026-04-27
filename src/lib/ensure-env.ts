import "server-only";

import { loadEnvConfig } from "@next/env";

let ensured = false;

export function ensureEnvLoaded(): void {
  if (ensured) return;
  ensured = true;

  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
    return;
  }

  loadEnvConfig(process.cwd());
}
