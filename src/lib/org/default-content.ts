/**
 * Org default content. Legacy asset paths under `/assets/...` are prefixed with `/org`
 * (served from `public/org/`), while migrated `/images/...` paths are kept absolute.
 * Route/link paths are kept as-is.
 *
 * Reads `defaultContent.yaml` from disk (with mtime cache) so admin saves apply without rebuild.
 */

import fs from "node:fs";
import { getDefaultContentReadFile, readDefaultContentFile } from "@/lib/org/default-content-file";

const ASSET_PREFIX = "/org";

export type Content = Record<string, unknown>;

const ROUTE_KEYS = new Set(["href", "ctaLink", "linkHref", "ctaHref", "adminPath"]);

const ASSET_KEYS = new Set([
  "image",
  "logo",
  "avatar",
  "backgroundImage",
  "headerLogo",
  "videoThumbnail",
  "sectionImage",
  "imageUrl",
  "mediaUrl",
  "logoUrl",
  "eyeImage",
  "roundLogoImage",
  "marqueeImage",
  "diagramImage",
  "thumbnailUrl",
  "fullSizeUrl",
  "downloadUrl",
  "backgroundImageUrl",
]);

function isAssetKey(key: string): boolean {
  if (ASSET_KEYS.has(key)) return true;
  if (key.endsWith("Image") || key.endsWith("Url")) {
    return !ROUTE_KEYS.has(key);
  }
  return false;
}

function isInternalPath(s: string): boolean {
  if (typeof s !== "string" || s.startsWith("http") || s.startsWith("//") || s.startsWith("#")) return false;
  return s.startsWith("/");
}

function looksLikeAssetPath(s: string): boolean {
  if (!isInternalPath(s)) return false;
  if (s.startsWith("/assets/")) return true;
  if (/\.(png|jpg|jpeg|svg|webp|gif|ico|mp4|pdf)$/i.test(s)) return true;
  return false;
}

function prefixAssetPath(s: string): string {
  if (!isInternalPath(s)) return s;
  if (s.startsWith("/images/")) return s;
  if (s.startsWith(ASSET_PREFIX)) return s;
  return ASSET_PREFIX + s;
}

function rewriteContent(obj: unknown, parentKey?: string): unknown {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string" && isInternalPath(obj)) {
      if (parentKey && ROUTE_KEYS.has(parentKey)) return obj;
      if (parentKey && isAssetKey(parentKey)) return prefixAssetPath(obj);
      if (looksLikeAssetPath(obj)) return prefixAssetPath(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map((item) => rewriteContent(item, parentKey));
  const out: Content = {};
  for (const [k, v] of Object.entries(obj as Content)) {
    out[k] = rewriteContent(v, k);
  }
  return out;
}

let cacheMtimeMs = -1;
let cachedRaw: Content = {};
let cachedSectionOrder: string[] = [];

function refreshCacheFromDisk(): void {
  const filePath = getDefaultContentReadFile();
  const stat = fs.statSync(filePath);
  if (stat.mtimeMs === cacheMtimeMs && cacheMtimeMs >= 0) return;
  const { defaultContent, sectionOrder } = readDefaultContentFile();
  cachedRaw = defaultContent as Content;
  cachedSectionOrder = sectionOrder;
  cacheMtimeMs = stat.mtimeMs;
}

/** Call after writing defaultContent.yaml so the next read picks up changes immediately. */
export function invalidateDefaultContentCache(): void {
  cacheMtimeMs = -1;
}

export function getSectionOrder(): string[] {
  refreshCacheFromDisk();
  return [...cachedSectionOrder];
}

export function getOrgDefaultContent(): Content {
  refreshCacheFromDisk();
  return rewriteContent(cachedRaw) as Content;
}
