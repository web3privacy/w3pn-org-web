const ORG_BASE = "/org";

/**
 * Normalize org asset URLs.
 * Keeps remote/data URLs intact and rewrites local asset paths into /org.
 */
export function orgAsset(src: string | undefined | null): string {
  if (!src || typeof src !== "string") return "";
  if (
    src.startsWith("http") ||
    src.startsWith("//") ||
    src.startsWith("data:") ||
    src.startsWith("/images/") ||
    src.startsWith(ORG_BASE) ||
    src.startsWith("/api")
  ) {
    return src;
  }
  if (src.startsWith("/projects/")) {
    const match = src.match(/^\/projects\/(.+)\.(png|jpg|jpeg|webp|svg)$/i);
    if (match) {
      return `${ORG_BASE}/assets/projects/${match[1]}-logo.svg`;
    }
  }
  if (src.startsWith("/assets/")) return `${ORG_BASE}${src}`;
  return `${ORG_BASE}${src.startsWith("/") ? src : `/${src}`}`;
}
