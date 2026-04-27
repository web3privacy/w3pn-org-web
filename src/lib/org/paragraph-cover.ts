/**
 * Paragraph publication cover extraction (server-side).
 * Mirrors scripts/paragraph-cover-lib.mjs — keep behaviour in sync.
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchParagraphPublicationHtml(publicationUrl: string): Promise<string> {
  const res = await fetch(publicationUrl, {
    headers: { "User-Agent": DEFAULT_UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${publicationUrl}: ${res.status}`);
  return await res.text();
}

export function extractCoverImageUrlFromParagraphHtml(html: string): string | null {
  const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (!m) return null;
  let og = m[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
  try {
    const u = new URL(og);
    if (u.hostname.endsWith("paragraph.com") && u.pathname.includes("/api/og")) {
      const cover = u.searchParams.get("coverPhotoUrl");
      if (cover) return decodeURIComponent(cover);
      const blog = u.searchParams.get("blogImageUrl");
      if (blog) return decodeURIComponent(blog);
    }
  } catch {
    /* ignore */
  }
  if (og.startsWith("http")) return og;
  return null;
}

export async function resolveParagraphCoverImageUrl(publicationUrl: string): Promise<string | null> {
  const html = await fetchParagraphPublicationHtml(publicationUrl);
  return extractCoverImageUrlFromParagraphHtml(html);
}

export function slugFromParagraphPublicationUrl(publicationUrl: string): string {
  try {
    const u = new URL(publicationUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "article";
  } catch {
    return "article";
  }
}

function extFromContentType(ct: string | null): string {
  if (!ct) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".jpg";
}

function extFromImageUrl(url: string): string | null {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  return null;
}

/** Download image to `destPathWithoutExt` + inferred extension. Returns absolute filesystem path. */
export async function downloadImageToFile(imageUrl: string, destPathWithoutExt: string): Promise<string> {
  const res = await fetch(imageUrl, { headers: { "User-Agent": DEFAULT_UA } });
  if (!res.ok) throw new Error(`Image fetch ${imageUrl}: ${res.status}`);
  const ext = extFromImageUrl(imageUrl) ?? extFromContentType(res.headers.get("content-type"));
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = destPathWithoutExt + ext;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return dest;
}

/** Web path under site root, e.g. `/org/article-covers/foo.png` */
export function publicWebPathFromAbsoluteFile(appRoot: string, absoluteFile: string): string {
  const pub = path.join(appRoot, "public");
  const rel = path.relative(pub, absoluteFile);
  return "/" + rel.split(path.sep).join("/");
}
