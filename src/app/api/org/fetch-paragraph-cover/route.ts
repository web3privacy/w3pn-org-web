import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { getAppPackageRoot } from "@/lib/app-package-root";
import {
  downloadImageToFile,
  resolveParagraphCoverImageUrl,
  slugFromParagraphPublicationUrl,
} from "@/lib/org/paragraph-cover";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "article";
}

/**
 * Resolve Paragraph publication cover and optionally save under public/org/article-covers/.
 * On Vercel (read-only FS), returns the direct image URL (GCS) without writing.
 */
export async function POST(request: NextRequest) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  let body: { href?: string };
  try {
    body = (await request.json()) as { href?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const href = typeof body.href === "string" ? body.href.trim() : "";
  let parsedHref: URL;
  try {
    parsedHref = new URL(href);
  } catch {
    return NextResponse.json({ error: "href must be a valid URL" }, { status: 400 });
  }

  if (parsedHref.protocol !== "https:" || !parsedHref.hostname.endsWith("paragraph.com")) {
    return NextResponse.json({ error: "href must be a paragraph.com publication URL" }, { status: 400 });
  }

  try {
    const imageUrl = await resolveParagraphCoverImageUrl(href);
    if (!imageUrl) {
      return NextResponse.json({ error: "Could not resolve cover from Paragraph page" }, { status: 422 });
    }

    if (IS_VERCEL_READONLY) {
      return NextResponse.json({ thumbnail: imageUrl, source: "remote" as const });
    }

    const slug = sanitizeSlug(slugFromParagraphPublicationUrl(href));
    const appRoot = getAppPackageRoot();
    const destBase = path.join(appRoot, "public", "org", "article-covers", slug);
    const abs = await downloadImageToFile(imageUrl, destBase);
    const webPath = "/" + path.relative(path.join(appRoot, "public"), abs).split(path.sep).join("/");
    await appendAdminAuditEntryFromRequest(request, {
      action: "content.fetch-paragraph-cover",
      target: webPath,
      summary: `Fetched Paragraph cover for ${slug}`,
      details: {
        href,
        imageUrl,
        savedTo: webPath,
      },
    });
    return NextResponse.json({ thumbnail: webPath, source: "local" as const });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
