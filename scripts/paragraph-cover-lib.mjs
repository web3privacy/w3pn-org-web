/**
 * Extract a stable cover image URL from a Paragraph publication HTML page.
 * Paragraph sets og:image to /api/og?...coverPhotoUrl=... (GCS) — we prefer the direct GCS URL.
 * Keep in sync with src/lib/org/paragraph-cover.ts (same behaviour).
 */

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchParagraphPublicationHtml(publicationUrl) {
  const res = await fetch(publicationUrl, {
    headers: { "User-Agent": DEFAULT_UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${publicationUrl}: ${res.status}`);
  return await res.text();
}

/**
 * @param {string} html
 * @returns {string | null} Direct image URL (GCS) or og:image URL suitable for <img src>
 */
export function extractCoverImageUrlFromParagraphHtml(html) {
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

export async function resolveParagraphCoverImageUrl(publicationUrl) {
  const html = await fetchParagraphPublicationHtml(publicationUrl);
  return extractCoverImageUrlFromParagraphHtml(html);
}

export function slugFromParagraphPublicationUrl(publicationUrl) {
  try {
    const u = new URL(publicationUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "article";
  } catch {
    return "article";
  }
}

function extFromContentType(ct) {
  if (!ct) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".jpg";
}

function extFromImageUrl(url) {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  return null;
}

export async function downloadImageToFile(imageUrl, destPathWithoutExt) {
  const res = await fetch(imageUrl, { headers: { "User-Agent": DEFAULT_UA } });
  if (!res.ok) throw new Error(`Image fetch ${imageUrl}: ${res.status}`);
  const ext = extFromImageUrl(imageUrl) ?? extFromContentType(res.headers.get("content-type"));
  const fs = await import("node:fs");
  const path = await import("node:path");
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = destPathWithoutExt + ext;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return dest;
}
