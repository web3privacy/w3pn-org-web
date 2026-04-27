import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import {
  AdminValidationError,
  parseAdminIdentifier,
  parseProjectDetailBody,
} from "@/lib/admin-validation";
import { loadProjectDetailFromYaml, saveProjectDetail } from "@/lib/org/project-details";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const { id: rawId } = await params;
  let id: string;
  try {
    id = parseAdminIdentifier(rawId, "Project id");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  return NextResponse.json(loadProjectDetailFromYaml(id));
}

export async function PUT(request: Request, { params }: { params: Params }) {
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
  const { id: rawId } = await params;
  let id: string;
  try {
    id = parseAdminIdentifier(rawId, "Project id");
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let detail: Record<string, unknown>;
  try {
    detail = parseProjectDetailBody(body);
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  saveProjectDetail(id, detail);
  await appendAdminAuditEntryFromRequest(request, {
    action: "projects.detail.update",
    target: `data/org/projects/details/${id}.yaml`,
    summary: `Updated project detail: ${id}`,
    details: {
      projectId: id,
      keys: Object.keys(detail),
    },
  });
  return NextResponse.json({ ok: true });
}
