import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { AdminValidationError, parseDefaultContentMerge } from "@/lib/admin-validation";
import { mergeTopLevelIntoDefaultContentFile } from "@/lib/org/default-content-file";
import { invalidateDefaultContentCache } from "@/lib/org/default-content";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

export async function PUT(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;

  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      { error: "Write operations are disabled on this deployment (read-only filesystem)." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let merge: Record<string, unknown>;
  try {
    merge = parseDefaultContentMerge(body);
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  try {
    mergeTopLevelIntoDefaultContentFile(merge);
    invalidateDefaultContentCache();
    await appendAdminAuditEntryFromRequest(request, {
      action: "content.update",
      target: "data/org/defaultContent.yaml",
      summary: `Updated shared content sections: ${Object.keys(merge).join(", ")}`,
      details: {
        keys: Object.keys(merge),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to write defaultContent.yaml" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
