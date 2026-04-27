import path from "node:path";
import { fileURLToPath } from "node:url";

let cached: string | null = null;

export function getAppPackageRoot(): string {
  if (cached) return cached;
  const here = path.dirname(fileURLToPath(import.meta.url));
  cached = path.resolve(here, "..", "..");
  return cached;
}
