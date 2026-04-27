/**
 * Strip the legacy `/org` URL prefix from asset-like strings before writing
 * `defaultContent.yaml`. Absolute `/images/...` paths stay absolute on disk.
 */

type JsonObject = Record<string, unknown>;

const ROUTE_KEYS = new Set([
  "href",
  "ctaLink",
  "linkHref",
  "ctaHref",
  "adminPath",
]);

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
  if (typeof s !== "string" || s.startsWith("http") || s.startsWith("//") || s.startsWith("#")) {
    return false;
  }
  return s.startsWith("/");
}

function looksLikeAssetPath(s: string): boolean {
  if (!isInternalPath(s)) return false;
  if (s.startsWith("/assets/")) return true;
  if (/\.(png|jpg|jpeg|svg|webp|gif|ico|mp4|pdf)$/i.test(s)) return true;
  return false;
}

function stripOrgIfAsset(s: string, parentKey?: string): string {
  if (!s.startsWith("/org/")) return s;
  const rest = s.slice(4);
  if (parentKey && ROUTE_KEYS.has(parentKey)) return s;
  if (parentKey && isAssetKey(parentKey)) return rest || "/";
  if (looksLikeAssetPath(rest)) return rest || "/";
  return s;
}

export function stripOrgPrefixesForDisk(obj: unknown, parentKey?: string): unknown {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      return stripOrgIfAsset(obj, parentKey);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripOrgPrefixesForDisk(item, parentKey));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as JsonObject)) {
    out[k] = stripOrgPrefixesForDisk(v, k);
  }
  return out;
}
