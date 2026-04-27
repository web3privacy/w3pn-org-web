import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { AdminValidationError, parseResourcesBody } from "@/lib/admin-validation";
import { getOrgDefaultContent, invalidateDefaultContentCache } from "@/lib/org/default-content";
import { mergeTopLevelIntoDefaultContentFile } from "@/lib/org/default-content-file";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

export async function GET(request: Request) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const resources = (getOrgDefaultContent().resources ?? {}) as Record<string, unknown>;
  return NextResponse.json({ resources });
}

export async function PUT(request: Request) {
  const crossSite = blockCrossSiteMutation(request);
  if (crossSite) return crossSite;

  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  if (IS_VERCEL_READONLY) {
    return NextResponse.json(
      { error: "Write operations are disabled in production." },
      { status: 403 }
    );
  }
  try {
    const body = await request.json();
    const resources = parseResourcesBody(body);
    mergeTopLevelIntoDefaultContentFile({ resources });
    invalidateDefaultContentCache();
    await appendAdminAuditEntryFromRequest(request, {
      action: "resources.update",
      target: "data/org/defaultContent.yaml",
      summary: "Updated resources configuration",
      details: {
        keys: Object.keys(resources),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
