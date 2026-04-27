import fs from "node:fs";
import path from "node:path";
import { getAppPackageRoot } from "@/lib/app-package-root";

const PACKAGE_ROOT = getAppPackageRoot();
const PACKAGE_DATA_ROOT = path.join(PACKAGE_ROOT, "data");

function resolveEnvPath(value: string | undefined, fallback: string): string {
  if (!value || !value.trim()) return fallback;
  return path.resolve(value.trim());
}

export function getPackageDataPath(...parts: string[]): string {
  return path.join(PACKAGE_DATA_ROOT, ...parts);
}

export function getWritableDataRoot(): string {
  return resolveEnvPath(process.env.W3PN_DATA_ROOT, PACKAGE_DATA_ROOT);
}

export function getWritableDataPath(...parts: string[]): string {
  return path.join(getWritableDataRoot(), ...parts);
}

export function getReadableDataPath(...parts: string[]): string {
  const writablePath = getWritableDataPath(...parts);
  if (fs.existsSync(writablePath)) return writablePath;
  return getPackageDataPath(...parts);
}

