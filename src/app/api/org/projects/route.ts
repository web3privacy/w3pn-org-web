import { NextResponse } from "next/server";
import { adminUnauthorizedResponse } from "@/lib/admin-api";
import { appendAdminAuditEntryFromRequest } from "@/lib/admin-audit";
import { AdminValidationError, parseProjectsIndexBody } from "@/lib/admin-validation";
import { loadProjectsFromYaml, saveProjectsIndex } from "@/lib/org/project-details";
import { IS_VERCEL_READONLY } from "@/lib/org/vercel-readonly";
import { blockCrossSiteMutation } from "@/lib/request-security";

export async function GET(request: Request) {
  const unauthorized = await adminUnauthorizedResponse(request);
  if (unauthorized) return unauthorized;
  const projects = loadProjectsFromYaml() ?? [];
  return NextResponse.json({ projects });
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let projects: Array<Record<string, unknown>>;
  try {
    projects = parseProjectsIndexBody(body);
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
  saveProjectsIndex(projects);
  await appendAdminAuditEntryFromRequest(request, {
    action: "projects.index.update",
    target: "data/org/projects/index.yaml",
    summary: `Updated project index (${projects.length} entries)`,
    details: {
      count: projects.length,
    },
  });
  return NextResponse.json({ ok: true });
}
